const readline = require('readline');

// Lista de palabras
const words = [
  { word: 'Bambas', translation: 'Zapatillas', language: 'portugués', notes: 'Calzado. Ej: Ele comprou umas bambas novas.' },
  { word: 'Abanou', translation: 'Sacudió', language: 'portugués', notes: 'Pasado de abanar. Ej: O cachorro abanou o rabo.' },
  { word: 'Minha espada quase vai parar no eBay', translation: 'Mi espada casi termina en eBay', language: 'portugués', notes: 'Frase' },
  { word: 'Lisonjeiro', translation: 'Halagador', language: 'portugués', notes: 'Ej: Foi um comentário muito lisonjeiro.' },
  { word: 'Não farás cocô na cabeça da Arte', translation: 'No harás caca en la cabeza del Arte', language: 'portugués', notes: 'Frase' },
  { word: 'Atordoado', translation: 'Aturdido', language: 'portugués', notes: 'Ej: Ele ficou atordoado com a notícia.' },
  { word: 'Surdo', translation: 'Sordo', language: 'portugués', notes: 'Ej: Ele é surdo do ouvido esquerdo.' },
  { word: 'Sou insultado por um esquilo', translation: 'Soy insultado por una ardilla', language: 'portugués', notes: 'Frase' },
  { word: 'Coelho', translation: 'Conejo', language: 'portugués', notes: 'Ej: O coelho pulou para dentro do mato.' },
  { word: 'Assobiou', translation: 'Silbó', language: 'portugués', notes: 'Pasado de assobiar. Ej: O vento assobiou durante a noite.' },
  { word: 'Buraco', translation: 'Agujero', language: 'portugués', notes: 'Ej: Há um buraco enorme na rua.' },
  { word: 'Caí em um Volkswagen', translation: 'Caí en un Volkswagen', language: 'portugués', notes: 'Frase' },
  { word: 'Boatos', translation: 'Rumores', language: 'portugués', notes: 'Ej: Espalharam boatos falsos sobre ela.' },
  { word: 'Freya é bonita! Ela tem gatos!', translation: '¡Freya es hermosa! ¡Tiene gatos!', language: 'portugués', notes: 'Frase' },
  { word: 'Canela', translation: 'Espinilla', language: 'portugués', notes: 'Parte de la pierna. Ej: Machuquei a canela jogando.' },
  { word: 'Gola', translation: 'Cuello', language: 'portugués', notes: 'De una prenda. Ej: A gola da camisa está suja.' },
  { word: 'Empolgante', translation: 'Emocionante', language: 'portugués', notes: 'Ej: Foi uma aventura muito empolgante.' },
  { word: 'Joalheiro', translation: 'Joyero', language: 'portugués', notes: 'Ej: O joalheiro consertou meu colar.' }
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
      
      const existingList = Array.isArray(existingData) ? existingData : (existingData.data || []);
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
