// api/services/knowledgeExportService.js - Servicio de Exportación de Conocimiento
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { getPool } = require('../database/db');

// Directorio temporal para almacenar zips listos para descarga
const tempExportsDir = path.join(__dirname, '../temp_exports');
if (!fs.existsSync(tempExportsDir)) {
  fs.mkdirSync(tempExportsDir, { recursive: true });
}

// Almacén en memoria de trabajos de exportación recientes
const exportJobs = new Map();

// Helper para sanitizar nombres de archivo
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

// Helper para generar slug seguro para anclas Markdown
function generateAnchor(title, id) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleanTitle}-${id}`;
}

// Helper para formatear bytes a string legible
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Clasificar carpeta de adjuntos según MIME type o extensión
function getAttachmentSubfolder(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'];
  const docExts = ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.xls', '.xlsx', '.csv', '.ppt', '.pptx'];

  if (imageExts.includes(ext) || mime.startsWith('image/')) {
    return 'images';
  }
  if (docExts.includes(ext) || mime.includes('pdf') || mime.includes('document') || mime.includes('text')) {
    return 'documents';
  }
  return 'other';
}

// Generador de resumen individual de nota
function generateNoteAiSummary(note) {
  const content = (note.content || '').trim();
  if (!content) {
    return 'La nota no contiene texto suficiente para generar un resumen detallado.';
  }

  // Extraer líneas de texto significativas (ignorando encabezados vacíos)
  const lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('# '));

  if (lines.length === 0) {
    return `Nota sobre "${note.title}". Registrada sin detalles adicionales.`;
  }

  const samplePoints = lines
    .slice(0, 3)
    .map(l => l.replace(/^[#*-]\s*/, '').trim())
    .filter(l => l.length > 5);

  let summary = `Esta nota aborda **${note.title}**. `;
  if (samplePoints.length > 0) {
    summary += `Puntos clave tratados:\n- ` + samplePoints.join('\n- ');
  } else {
    summary += `Incluye conceptos y referencias técnicas almacenadas en el Knowledge Hub.`;
  }
  return summary;
}

// Generador de visión general de la categoría (AI Overview)
function generateCategoryAiOverview(categoryName, areaName, notes) {
  if (!notes || notes.length === 0) {
    return `La categoría **${categoryName}** (${areaName}) actualmente no contiene notas registradas.`;
  }

  const titles = notes.map(n => n.title).join(', ');
  const totalNotes = notes.length;

  let overview = `La categoría **${categoryName}**, perteneciente al área de **${areaName}**, consolida un total de **${totalNotes}** ${totalNotes === 1 ? 'nota documentada' : 'notas interconectadas'}.\n\n`;
  overview += `### Temas y Conceptos Principales\n`;
  overview += `Los tópicos centrales registrados abarcan: ${titles}.\n\n`;
  overview += `### Estructura y Conexiones\n`;
  overview += `El conocimiento registrado en este paquete preserva tanto la visión conceptual de cada nota como sus relaciones explícitas, enlaces directos y referencias cruzadas hacia otras ramas de la base de conocimiento personal.`;

  return overview;
}

// Limpiar exportaciones temporales mayores a 1 hora
function cleanupOldExports() {
  try {
    const now = Date.now();
    const files = fs.readdirSync(tempExportsDir);
    for (const file of files) {
      const filePath = path.join(tempExportsDir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error('Error en cleanupOldExports:', err.message);
  }
}

// ─── API MÉTODOS ─────────────────────────────────────────────────────────────

/**
 * Resuelve las categorías incluidas en base al ámbito seleccionado (Área, Categoría única o Múltiples)
 */
async function resolveScopeCategories(userId, options, db) {
  const {
    scopeType = 'category',
    areaId,
    categoryId,
    categoryIds = [],
    includeSubcategories = true
  } = options;

  let targetCatIds = [];
  let areaName = '';
  let areaColor = '#8b5cf6';
  let categoryName = '';
  let subcategories = [];
  let primaryCategory = null;

  // 1. ÁREA COMPLETA (Categoría grande / Macro-área)
  if (scopeType === 'area' && areaId) {
    const [areaRows] = await db.execute(`
      SELECT id, name, description, color FROM knowledge_areas WHERE id = ? AND user_id = ?
    `, [areaId, userId]);
    if (areaRows.length === 0) throw new Error('Área no encontrada.');
    const area = areaRows[0];
    areaName = area.name;
    areaColor = area.color || '#8b5cf6';
    categoryName = `Todas las categorías de ${area.name}`;

    const [catRows] = await db.execute(`
      SELECT id, name, parent_id FROM knowledge_categories WHERE area_id = ? AND user_id = ?
    `, [areaId, userId]);

    targetCatIds = catRows.map(c => c.id);
    subcategories = catRows.filter(c => c.parent_id != null).map(c => ({ id: c.id, name: c.name }));
    primaryCategory = {
      id: null,
      name: categoryName,
      area_id: area.id,
      area_name: area.name,
      area_color: areaColor
    };
  }
  // 2. SELECCIÓN MÚLTIPLE DE CATEGORÍAS O SUBCATEGORÍAS
  else if (scopeType === 'multiple' && Array.isArray(categoryIds) && categoryIds.length > 0) {
    const [catRows] = await db.query(`
      SELECT c.id, c.name, c.parent_id, a.id as area_id, a.name as area_name, a.color as area_color
      FROM knowledge_categories c
      JOIN knowledge_areas a ON c.area_id = a.id
      WHERE c.id IN (?) AND c.user_id = ?
    `, [categoryIds, userId]);

    if (catRows.length === 0) throw new Error('No se encontraron las categorías seleccionadas.');

    let allCatIds = catRows.map(c => c.id);
    if (includeSubcategories && allCatIds.length > 0) {
      const [subRows] = await db.query(`
        SELECT id, name, parent_id FROM knowledge_categories WHERE parent_id IN (?) AND user_id = ?
      `, [allCatIds, userId]);
      allCatIds.push(...subRows.map(s => s.id));
      subcategories = subRows.map(s => ({ id: s.id, name: s.name }));
    }

    targetCatIds = Array.from(new Set(allCatIds));
    const uniqueAreaNames = Array.from(new Set(catRows.map(c => c.area_name)));
    areaName = uniqueAreaNames.join(', ');
    areaColor = catRows[0]?.area_color || '#8b5cf6';
    categoryName = catRows.map(c => c.name).slice(0, 3).join(', ') + (catRows.length > 3 ? ` (+${catRows.length - 3})` : '');

    primaryCategory = {
      id: null,
      name: categoryName,
      area_id: catRows[0]?.area_id,
      area_name: areaName,
      area_color: areaColor
    };
  }
  // 3. CATEGORÍA INDIVIDUAL
  else if (categoryId) {
    const [catRows] = await db.execute(`
      SELECT c.id, c.name, c.description, a.id as area_id, a.name as area_name, a.color as area_color
      FROM knowledge_categories c
      JOIN knowledge_areas a ON c.area_id = a.id
      WHERE c.id = ? AND c.user_id = ?
    `, [categoryId, userId]);

    if (catRows.length === 0) {
      throw new Error('Categoría no encontrada o no pertenece al usuario.');
    }
    const category = catRows[0];
    areaName = category.area_name;
    areaColor = category.area_color;
    categoryName = category.name;
    primaryCategory = category;

    targetCatIds = [category.id];
    if (includeSubcategories) {
      const [subRows] = await db.execute(`
        SELECT id, name, description 
        FROM knowledge_categories 
        WHERE parent_id = ? AND user_id = ?
      `, [category.id, userId]);

      subcategories = subRows.map(s => ({ id: s.id, name: s.name }));
      targetCatIds.push(...subRows.map(s => s.id));
    }
  } else {
    throw new Error('Debe especificar un ámbito válido (área, categoría o selección múltiple).');
  }

  return {
    targetCatIds,
    areaName,
    areaColor,
    categoryName,
    subcategories,
    primaryCategory,
    scopeType
  };
}

/**
 * Genera la vista previa de una exportación para mostrar estadísticas antes de empaquetar
 */
async function getExportPreview(userId, options = {}) {
  const db = getPool();
  const {
    targetCatIds,
    areaName,
    areaColor,
    categoryName,
    subcategories,
    primaryCategory,
    scopeType
  } = await resolveScopeCategories(userId, options, db);

  if (targetCatIds.length === 0) {
    return {
      scope_type: scopeType,
      category: primaryCategory,
      subcategories: [],
      categories_count: 0,
      note_count: 0,
      relationship_count: 0,
      attachment_count: 0,
      estimated_size_bytes: 0,
      estimated_size_formatted: '0 B'
    };
  }

  // Contar notas en las categorías
  const [notes] = await db.query(`
    SELECT id, title, LENGTH(COALESCE(content, '')) as content_len
    FROM knowledge_notes
    WHERE user_id = ? AND primary_category_id IN (?)
  `, [userId, targetCatIds]);

  const noteCount = notes.length;
  const noteIds = notes.map(n => n.id);

  let relationshipCount = 0;
  let attachmentCount = 0;
  let totalAttachmentBytes = 0;

  if (noteIds.length > 0) {
    // Contar relaciones que involucren a estas notas
    const [[relCountRow]] = await db.query(`
      SELECT COUNT(*) as count
      FROM knowledge_relations
      WHERE user_id = ? AND (source_note_id IN (?) OR target_note_id IN (?))
    `, [userId, noteIds, noteIds]);
    relationshipCount = relCountRow.count;

    // Contar y sumar adjuntos
    const [[attCountRow]] = await db.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_bytes
      FROM knowledge_attachments
      WHERE user_id = ? AND note_id IN (?)
    `, [userId, noteIds]);
    attachmentCount = attCountRow.count;
    totalAttachmentBytes = parseInt(attCountRow.total_bytes, 10) || 0;
  }

  // Estimar tamaño del markdown (aprox longitud de notas + 5KB de metadatos)
  const notesTextBytes = notes.reduce((acc, n) => acc + (n.content_len || 0), 0) + 5000;
  const estimatedSizeBytes = totalAttachmentBytes + notesTextBytes;

  return {
    scope_type: scopeType,
    category: primaryCategory,
    subcategories: subcategories,
    categories_count: targetCatIds.length,
    note_count: noteCount,
    relationship_count: relationshipCount,
    attachment_count: attachmentCount,
    estimated_size_bytes: estimatedSizeBytes,
    estimated_size_formatted: formatBytes(estimatedSizeBytes)
  };
}

/**
 * Crea el paquete de exportación ZIP completo con el documento Markdown consolidado y adjuntos
 */
async function generateExportPackage(userId, options = {}) {
  cleanupOldExports();

  const {
    scopeType = 'category',
    areaId,
    categoryId,
    categoryIds = [],
    includeSubcategories = true,
    includeAttachments = true,
    includeRelationships = true,
    generateAiSummaries = true
  } = options;

  const db = getPool();
  const {
    targetCatIds,
    areaName,
    areaColor,
    categoryName,
    subcategories,
    primaryCategory
  } = await resolveScopeCategories(userId, options, db);

  const catIds = targetCatIds;

  // 3. Obtener todas las notas del ámbito
  let notes = [];
  if (catIds.length > 0) {
    const [notesRows] = await db.query(`
      SELECT n.id, n.title, n.content, n.note_type, n.status, n.created_at, n.updated_at,
             n.primary_category_id, c.name as category_name
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      WHERE n.user_id = ? AND n.primary_category_id IN (?)
      ORDER BY c.sort_order ASC, c.name ASC, n.title ASC
    `, [userId, catIds]);
    notes = notesRows;
  }

  const noteIds = notes.map(n => n.id);
  const exportedNoteIdsSet = new Set(noteIds);

  // Mapeo de anclas únicas por nota para navegación de TOC y relaciones
  const noteAnchorMap = new Map();
  notes.forEach(n => {
    noteAnchorMap.set(n.id, generateAnchor(n.title, n.id));
  });

  // 4. Obtener Tags para cada nota
  const tagsByNoteId = new Map();
  if (noteIds.length > 0) {
    const [tagRows] = await db.query(`
      SELECT nt.note_id, t.name, t.color
      FROM knowledge_note_tags nt
      JOIN knowledge_tags t ON nt.tag_id = t.id
      WHERE nt.note_id IN (?)
    `, [noteIds]);

    tagRows.forEach(r => {
      if (!tagsByNoteId.has(r.note_id)) tagsByNoteId.set(r.note_id, []);
      tagsByNoteId.get(r.note_id).push(r.name);
    });
  }

  // 5. Obtener Adjuntos para cada nota
  const attachmentsByNoteId = new Map();
  const allAttachmentsToCollect = [];
  if (noteIds.length > 0 && includeAttachments) {
    const [attRows] = await db.query(`
      SELECT id, note_id, filename, storage_path, mime_type, file_size
      FROM knowledge_attachments
      WHERE user_id = ? AND note_id IN (?)
    `, [userId, noteIds]);

    attRows.forEach(att => {
      if (!attachmentsByNoteId.has(att.note_id)) attachmentsByNoteId.set(att.note_id, []);
      attachmentsByNoteId.get(att.note_id).push(att);
      allAttachmentsToCollect.push(att);
    });
  }

  // 6. Obtener y resolver Relaciones
  const relationsByNoteId = new Map();
  let totalRelationshipsCount = 0;

  if (noteIds.length > 0 && includeRelationships) {
    const [relRows] = await db.query(`
      SELECT r.id, r.source_note_id, r.target_note_id, r.relation_type, r.origin, r.description,
             src.title as source_title, src_c.name as source_category,
             tgt.title as target_title, tgt_c.name as target_category
      FROM knowledge_relations r
      JOIN knowledge_notes src ON r.source_note_id = src.id
      JOIN knowledge_notes tgt ON r.target_note_id = tgt.id
      LEFT JOIN knowledge_categories src_c ON src.primary_category_id = src_c.id
      LEFT JOIN knowledge_categories tgt_c ON tgt.primary_category_id = tgt_c.id
      WHERE r.user_id = ? AND (r.source_note_id IN (?) OR r.target_note_id IN (?))
    `, [userId, noteIds, noteIds]);

    totalRelationshipsCount = relRows.length;

    relRows.forEach(rel => {
      // Registrar en nota fuente
      if (exportedNoteIdsSet.has(rel.source_note_id)) {
        if (!relationsByNoteId.has(rel.source_note_id)) relationsByNoteId.set(rel.source_note_id, []);
        relationsByNoteId.get(rel.source_note_id).push({
          relationId: rel.id,
          direction: 'outgoing',
          relationType: rel.relation_type,
          isInternal: exportedNoteIdsSet.has(rel.target_note_id),
          relatedNoteId: rel.target_note_id,
          relatedTitle: rel.target_title,
          relatedCategory: rel.target_category || 'General'
        });
      }
      // Registrar en nota destino
      if (exportedNoteIdsSet.has(rel.target_note_id)) {
        if (!relationsByNoteId.has(rel.target_note_id)) relationsByNoteId.set(rel.target_note_id, []);
        relationsByNoteId.get(rel.target_note_id).push({
          relationId: rel.id,
          direction: 'incoming',
          relationType: `referenced by (${rel.relation_type})`,
          isInternal: exportedNoteIdsSet.has(rel.source_note_id),
          relatedNoteId: rel.source_note_id,
          relatedTitle: rel.source_title,
          relatedCategory: rel.source_category || 'General'
        });
      }
    });
  }

  // 7. Mapear rutas relativas de adjuntos en el archivo
  // attachmentPathMap: Map(attachment.id -> relativePathInArchive)
  const attachmentPathMap = new Map();
  const safeFilenameUsage = new Map(); // Para evitar colisiones de nombres

  allAttachmentsToCollect.forEach(att => {
    const subfolder = getAttachmentSubfolder(att.filename, att.mime_type);
    let safeName = sanitizeFilename(att.filename);

    // Evitar sobreescritura de nombres duplicados
    const count = (safeFilenameUsage.get(safeName) || 0) + 1;
    safeFilenameUsage.set(safeName, count);

    if (count > 1) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      safeName = `${base}_${count}${ext}`;
    }

    const relativePath = `attachments/${subfolder}/${safeName}`;
    attachmentPathMap.set(att.id, {
      relativePath,
      archiveEntryName: `knowledge-export/${relativePath}`,
      originalStoragePath: att.storage_path
    });
  });

  // 8. Construir Documento Markdown Consolidado (Knowledge-Export.md)
  let md = '';

  // ─── A. YAML FRONTMATTER ──────────────────────────────────────────────────
  const nowIso = new Date().toISOString();
  md += `---\n`;
  md += `title: "Knowledge Export - ${categoryName}"\n`;
  md += `type: knowledge-export\n`;
  md += `exported_at: "${nowIso}"\n`;
  md += `source_area: "${areaName}"\n`;
  md += `source_category: "${categoryName}"\n`;
  md += `scope_type: "${scopeType}"\n`;
  md += `included_subcategories:\n`;
  subcategories.forEach(sc => {
    md += `  - "${sc.name}"\n`;
  });
  md += `note_count: ${notes.length}\n`;
  md += `relationship_count: ${totalRelationshipsCount}\n`;
  md += `attachment_count: ${allAttachmentsToCollect.length}\n`;
  md += `includes:\n`;
  md += `  relationships: ${includeRelationships}\n`;
  md += `  attachments: ${includeAttachments}\n`;
  md += `  ai_summaries: ${generateAiSummaries}\n`;
  md += `---\n\n`;

  // ─── B. CATEGORY OVERVIEW ─────────────────────────────────────────────────
  md += `# Knowledge Export: ${categoryName}\n\n`;
  md += `## Category Overview\n\n`;
  if (generateAiSummaries) {
    md += `${generateCategoryAiOverview(categoryName, areaName, notes)}\n\n`;
  } else {
    md += `Exportación consolidada de **${categoryName}** (${areaName}). Contiene ${notes.length} notas seleccionadas.\n\n`;
  }

  // ─── C. TABLE OF CONTENTS ─────────────────────────────────────────────────
  md += `## Table of Contents\n\n`;

  // Agrupar entradas del TOC por subcategoría
  const notesByCatName = new Map();
  notes.forEach(note => {
    const cName = note.category_name || categoryName;
    if (!notesByCatName.has(cName)) notesByCatName.set(cName, []);
    notesByCatName.get(cName).push(note);
  });

  notesByCatName.forEach((catNotes, cName) => {
    md += `### ${cName}\n\n`;
    catNotes.forEach(note => {
      const anchor = noteAnchorMap.get(note.id);
      md += `- [${note.title}](#${anchor})\n`;
    });
    md += `\n`;
  });

  md += `---\n\n`;

  // ─── D. INDIVIDUAL NOTES ──────────────────────────────────────────────────
  for (const note of notes) {
    const anchor = noteAnchorMap.get(note.id);
    const noteTags = tagsByNoteId.get(note.id) || [];
    const noteAttachments = attachmentsByNoteId.get(note.id) || [];
    const noteRelations = relationsByNoteId.get(note.id) || [];

    // Título y ancla única
    md += `<a id="${anchor}"></a>\n\n`;
    md += `# ${note.title}\n\n`;

    // 1. Resumen de IA
    if (generateAiSummaries) {
      md += `## AI Summary\n\n`;
      md += `${generateNoteAiSummary(note)}\n\n`;
    }

    // 2. Contenido Original (reequipando rutas de adjuntos si existen)
    md += `## Original Content\n\n`;
    let rewrittenContent = note.content || '*Sin contenido*';

    // Reescribir rutas locales de archivos en el markdown
    noteAttachments.forEach(att => {
      const mapping = attachmentPathMap.get(att.id);
      if (mapping && att.storage_path) {
        rewrittenContent = rewrittenContent.split(att.storage_path).join(mapping.relativePath);
      }
    });

    md += `${rewrittenContent}\n\n`;

    // 3. Metadatos
    md += `## Metadata\n\n`;
    md += `- **ID:** ${note.id}\n`;
    md += `- **Category:** ${note.category_name || category.name}\n`;
    md += `- **Tags:** ${noteTags.length > 0 ? noteTags.map(t => `#${t}`).join(' ') : '*Ninguna*'}\n`;
    md += `- **Created:** ${note.created_at ? new Date(note.created_at).toISOString().split('T')[0] : 'N/A'}\n`;
    md += `- **Updated:** ${note.updated_at ? new Date(note.updated_at).toISOString().split('T')[0] : 'N/A'}\n\n`;

    // 4. Relaciones Internas y Externas
    if (includeRelationships) {
      const internalRelations = noteRelations.filter(r => r.isInternal);
      const externalRelations = noteRelations.filter(r => !r.isInternal);

      if (internalRelations.length > 0) {
        md += `## Relationships\n\n`;
        internalRelations.forEach(r => {
          const targetAnchor = noteAnchorMap.get(r.relatedNoteId);
          md += `- **${r.relationType}**: [${r.relatedTitle}](#${targetAnchor})\n`;
        });
        md += `\n`;
      }

      if (externalRelations.length > 0) {
        md += `## External Relationships\n\n`;
        externalRelations.forEach(r => {
          md += `- **${r.relationType}**: [${r.relatedTitle}]\n`;
          md += `  - **Category**: ${r.relatedCategory}\n`;
          md += `  - **Note ID**: ${r.relatedNoteId}\n`;
        });
        md += `\n`;
      }
    }

    // 5. Adjuntos
    if (includeAttachments && noteAttachments.length > 0) {
      md += `## Attachments\n\n`;
      noteAttachments.forEach(att => {
        const mapping = attachmentPathMap.get(att.id);
        const subfolder = getAttachmentSubfolder(att.filename, att.mime_type);
        if (subfolder === 'images') {
          md += `![${att.filename}](${mapping.relativePath})\n\n`;
        } else {
          md += `📎 [${att.filename}](${mapping.relativePath})\n\n`;
        }
      });
    }

    md += `---\n\n`;
  }

  // 9. Construir el paquete ZIP con archiver
  const exportId = crypto.randomUUID();
  const dateStr = new Date().toISOString().split('T')[0];
  const zipFilename = `knowledge-export-${sanitizeFilename(categoryName)}-${dateStr}.zip`;
  const outputZipPath = path.join(tempExportsDir, `${exportId}.zip`);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver.ZipArchive
      ? new archiver.ZipArchive({ zlib: { level: 9 } })
      : (typeof archiver === 'function' ? archiver('zip', { zlib: { level: 9 } }) : new archiver.default.ZipArchive({ zlib: { level: 9 } }));

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    // Agregar el documento Markdown consolidado
    archive.append(md, { name: 'knowledge-export/Knowledge-Export.md' });

    // Copiar adjuntos al archivo ZIP
    if (includeAttachments) {
      const publicUploadsBase = path.join(__dirname, '../public');

      allAttachmentsToCollect.forEach(att => {
        const mapping = attachmentPathMap.get(att.id);
        if (!mapping) return;

        // Limpiar path para evitar traversal attacks
        const cleanStoragePath = path.normalize(att.storage_path).replace(/^(\.\.[\/\\])+/, '');
        const diskPath = path.join(publicUploadsBase, cleanStoragePath);

        if (fs.existsSync(diskPath)) {
          archive.file(diskPath, { name: mapping.archiveEntryName });
        } else {
          // Si el archivo físico falta, registrar un aviso de texto en el zip
          archive.append(
            `Archivo ${att.filename} no disponible en el servidor en el momento de la exportación.`,
            { name: `${mapping.archiveEntryName}.txt` }
          );
        }
      });
    }

    archive.finalize();
  });

  const zipStat = fs.statSync(outputZipPath);

  // Registrar trabajo para descarga
  const jobInfo = {
    exportId,
    filename: zipFilename,
    filePath: outputZipPath,
    categoryName: categoryName,
    size: zipStat.size,
    createdAt: Date.now()
  };
  exportJobs.set(exportId, jobInfo);

  return {
    export_id: exportId,
    filename: zipFilename,
    size_bytes: zipStat.size,
    size_formatted: formatBytes(zipStat.size),
    download_url: `/api/knowledge/export/${exportId}/download`
  };
}

/**
 * Obtener archivo para descarga y registrar eliminación
 */
function getExportJob(exportId) {
  return exportJobs.get(exportId) || null;
}

module.exports = {
  getExportPreview,
  generateExportPackage,
  getExportJob
};
