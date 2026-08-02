const readline = require('readline');

// Lista de palabras
const words = [
  { word: 'Arfaram', translation: 'Jadearon', language: 'portugués', notes: 'Eles arfaram de cansaço após a corrida.' },
  { word: 'Trapaceiros', translation: 'Tramposos', language: 'portugués', notes: 'Os trapaceiros foram expulsos do jogo.' },
  { word: 'Enjoo', translation: 'Mareo', language: 'portugués', notes: 'Senti um forte enjoo no barco.' },
  { word: 'Bode', translation: 'Chivo', language: 'portugués', notes: 'O bode fugiu do cercado.' },
  { word: 'Enevoada', translation: 'Nublada', language: 'portugués', notes: 'A manhã estava muito enevoada.' },
  { word: 'Rocha', translation: 'Roca', language: 'portugués', notes: 'Eles escalaram uma rocha enorme.' },
  { word: 'Fazer manha', translation: 'Hacer berrinche', language: 'portugués', notes: 'A criança começou a fazer manha no mercado.' },
  { word: 'Corça', translation: 'Cierva', language: 'portugués', notes: 'A corça correu para a floresta.' },
  { word: 'Vermes', translation: 'Gusanos', language: 'portugués', notes: 'Havia vermes na maçã estragada.' },
  { word: 'Exauriu', translation: 'Agotó', language: 'portugués', notes: 'O esforço exauriu todas as suas forças.' },
  { word: 'Explosão de pó', translation: 'Explosión de polvo', language: 'portugués', notes: 'A explosão de pó destruiu a fábrica.' },
  { word: 'Arrepio', translation: 'Escalofrío', language: 'portugués', notes: 'Senti um arrepio de frio.' },
  { word: 'Gaiola', translation: 'Jaula', language: 'portugués', notes: 'O pássaro escapou da gaiola.' },
  { word: 'Armadilha', translation: 'Trampa', language: 'portugués', notes: 'O animal caiu na armadilha.' },
  { word: 'Engraçado', translation: 'Gracioso', language: 'portugués', notes: 'O filme era muito engraçado.' },
  { word: 'Atingir', translation: 'Alcanzar', language: 'portugués', notes: 'Ele conseguiu atingir a meta.' },
  { word: 'Surtou', translation: 'Enloqueció', language: 'portugués', notes: 'Ela surtou quando viu o problema.' },
  { word: 'Vira-lata', translation: 'Perro callejero', language: 'portugués', notes: 'Adotei um cachorro vira-lata.' },
  { word: 'Mané', translation: 'Tonto', language: 'portugués', notes: 'Não seja mané, ele está mentindo.' }
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
