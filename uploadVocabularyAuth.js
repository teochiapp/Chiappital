const readline = require('readline');

// Lista de palabras - Vocabulário: O Último Desejo
const words = [
  { word: 'Esfregar', translation: 'Frotar', language: 'portugués', notes: 'Ele começou a esfregar os olhos. (O Último Desejo)' },
  { word: 'Advir', translation: 'Provenir, derivar', language: 'portugués', notes: 'Muitos problemas podem advir dessa decisão. (O Último Desejo)' },
  { word: 'Descrença', translation: 'Incredulidad', language: 'portugués', notes: 'Ela olhou para ele com descrença. (O Último Desejo)' },
  { word: 'Açular', translation: 'Azuzar, incitar', language: 'portugués', notes: 'Ele tentou açular os cães contra o inimigo. (O Último Desejo)' },
  { word: 'Uivar', translation: 'Aullar', language: 'portugués', notes: 'O lobo começou a uivar durante a noite. (O Último Desejo)' },
  { word: 'Dívida', translation: 'Deuda', language: 'portugués', notes: 'Preciso pagar minha dívida. (O Último Desejo)' },
  { word: 'Genro', translation: 'Yerno', language: 'portugués', notes: 'Meu genro é muito simpático. (O Último Desejo)' },
  { word: 'Poeira', translation: 'Polvo', language: 'portugués', notes: 'Os móveis estavam cobertos de poeira. (O Último Desejo)' },
  { word: 'Encabular', translation: 'Avergonzar, cohibir', language: 'portugués', notes: 'Não quero te encabular com meus elogios. (O Último Desejo)' },
  { word: 'Praguejar', translation: 'Maldecir, blasfemar', language: 'portugués', notes: 'Começou a praguejar de raiva. (O Último Desejo)' },
  { word: 'Empáfia', translation: 'Arrogancia, soberbia', language: 'portugués', notes: 'Falava com uma empáfia insuportável. (O Último Desejo)' },
  { word: 'Perscrutador', translation: 'Escrutador, inquisitivo', language: 'portugués', notes: 'Lançou-lhe um olhar perscrutador. (O Último Desejo)' },
  { word: 'Beldade', translation: 'Belleza, persona hermosa', language: 'portugués', notes: 'Era considerada uma verdadeira beldade. (O Último Desejo)' },
  { word: 'Tiquinho', translation: 'Poquito', language: 'portugués', notes: 'Coloque só um tiquinho de açúcar. (O Último Desejo)' },
  { word: 'Tagarelar', translation: 'Parlotear, hablar sin parar', language: 'portugués', notes: 'Ela gosta de tagarelar durante as viagens. (O Último Desejo)' },
  { word: 'Maltrapilho', translation: 'Harapiento, andrajoso', language: 'portugués', notes: 'Um homem maltrapilho caminhava pela cidade. (O Último Desejo)' },
  { word: 'Babaca', translation: 'Idiota, imbécil', language: 'portugués', notes: 'Deixa de ser babaca! (O Último Desejo)' }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_BASE_URL = 'https://apichiappital.surcodes.com/api';

console.log('🚀 Script en Node.js para subir palabras a la Base de Datos');
console.log('------------------------------------------------------------');

rl.question('Ingresa tu email de usuario (Chiappital):\n> ', (email) => {
  rl.question('Ingresa tu contraseña:\n> ', async (password) => {
    console.log('\nAutenticando...');
    try {
      // 1. Login para obtener el token
      const authRes = await fetch(`${API_BASE_URL}/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });

      const authData = await authRes.json();

      if (!authData.jwt) {
        console.log('❌ Error de autenticación: Verifica tu email y contraseña.');
        rl.close();
        return;
      }

      const token = authData.jwt;
      console.log('✅ Autenticación exitosa. Subiendo palabras...');
      // 2. Fetch existing words
      console.log('Obteniendo palabras existentes...');
      const existingRes = await fetch(`${API_BASE_URL}/personal/vocabulary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const existingData = await existingRes.json();

      const existingList = Array.isArray(existingData) ? existingData : (existingData.vocabulary || existingData.data || []);
      const existingMap = {};
      existingList.forEach(item => {
        const wordText = item.attributes ? item.attributes.word : item.word;
        if (wordText) existingMap[wordText.toLowerCase()] = item.id;
      });

      // 3. Subir o actualizar palabras una por una
      let successCount = 0;
      let updateCount = 0;

      for (const w of words) {
        const existingId = existingMap[w.word.toLowerCase()];

        const url = existingId ? `${API_BASE_URL}/personal/vocabulary/${existingId}` : `${API_BASE_URL}/personal/vocabulary`;
        const method = existingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(w)
        });

        if (res.ok) {
          console.log(`✅ ${method === 'PUT' ? 'Actualizada' : 'Agregada'}: ${w.word}`);
          if (method === 'PUT') updateCount++;
          else successCount++;
        } else {
          console.log(`❌ Error al ${method === 'PUT' ? 'actualizar' : 'agregar'} "${w.word}": HTTP ${res.status}`);
        }
      }

      console.log('------------------------------------------------');
      console.log(`🎉 ¡Proceso finalizado! Se agregaron ${successCount} y se actualizaron ${updateCount} palabras de un total de ${words.length}.`);
    } catch (error) {
      console.log('❌ Error en el proceso:', error.message);
    }
    rl.close();
  });
});
