const readline = require('readline');

// Lista de palabras
const words = [
  { word: 'De graça', translation: 'Gratis', language: 'portugués', notes: 'Ex: Ele conseguiu os ingressos de graça.' },
  { word: 'Ferrugem', translation: 'Óxido / Herrumbre', language: 'portugués', notes: 'Ex: A bicicleta velha estava coberta de ferrugem.' },
  { word: 'Grudados', translation: 'Pegados', language: 'portugués', notes: 'Ex: Os dois amigos estão sempre grudados.' },
  { word: 'Moleque', translation: 'Chico / Niño / Pibe', language: 'portugués', notes: 'Ex: Aquele moleque não para quieto!' },
  { word: 'Lençóis', translation: 'Sábanas', language: 'portugués', notes: 'Ex: Preciso trocar os lençóis da cama.' },
  { word: 'Reféns', translation: 'Rehenes', language: 'portugués', notes: 'Ex: Os ladrões fizeram três pessoas reféns.' },
  { word: 'Bolhas', translation: 'Burbujas / Ampollas', language: 'portugués', notes: 'Ex: Meu sapato novo me deu bolhas nos pés.' },
  { word: 'Remexeu', translation: 'Removió / Hurgó', language: 'portugués', notes: 'Ex: Ele remexeu na gaveta procurando as chaves.' },
  { word: 'Estragado', translation: 'Arruinado / Echado a perder', language: 'portugués', notes: 'Ex: O leite ficou fora da geladeira e está estragado.' },
  { word: 'Pombo', translation: 'Paloma', language: 'portugués', notes: 'Ex: Tinha um pombo na praça comendo migalhas.' },
  { word: 'Carimbado', translation: 'Sellado', language: 'portugués', notes: 'Ex: Meu passaporte já foi carimbado.' },
  { word: 'Barganhar', translation: 'Regatear', language: 'portugués', notes: 'Ex: Ele conseguiu barganhar um bom preço no mercado.' },
  { word: 'Calçada', translation: 'Acera / Vereda', language: 'portugués', notes: 'Ex: Não ande na rua, use a calçada.' },
  { word: 'Magrelo', translation: 'Flacucho', language: 'portugués', notes: 'Ex: Ele é muito alto e magrelo.' },
  { word: 'Agourento', translation: 'Siniestro / De mal agüero', language: 'portugués', notes: 'Ex: Aquele corvo tem um olhar agourento.' },
  { word: 'Vazou', translation: 'Se filtró / Se fugó', language: 'portugués', notes: 'Ex: A água do cano quebrado vazou pela casa toda.' },
  { word: 'Rarefeito', translation: 'Enrarecido / Poco denso', language: 'portugués', notes: 'Ex: O ar na montanha é muito rarefeito.' },
  { word: 'Degraus', translation: 'Escalones', language: 'portugués', notes: 'Ex: Cuidado ao descer os degraus da escada.' },
  { word: 'Cuspir', translation: 'Escupir', language: 'portugués', notes: 'Ex: É falta de educação cuspir no chão.' },
  { word: 'Jujuba', translation: 'Gomita (dulce)', language: 'portugués', notes: 'Ex: Eu adoro comer jujuba de morango.' },
  { word: 'Espirra', translation: 'Estornuda / Salpica', language: 'portugués', notes: 'Ex: Ele tem alergia e espirra o tempo todo.' },
  { word: 'Magoou', translation: 'Lastimó / Ofendió / Hirió', language: 'portugués', notes: 'Ex: O que você disse me magoou muito.' }
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
      
      // 2. Subir palabras una por una
      let successCount = 0;
      for (const w of words) {
        const res = await fetch(`${API_BASE_URL}/personal/vocabulary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(w)
        });
        
        if (res.ok) {
          console.log(`✅ Agregada: ${w.word}`);
          successCount++;
        } else {
          console.log(`❌ Error al agregar "${w.word}": HTTP ${res.status}`);
        }
      }
      
      console.log('------------------------------------------------');
      console.log(`🎉 ¡Proceso finalizado! Se agregaron ${successCount} de ${words.length} palabras.`);
    } catch (error) {
      console.log('❌ Error en el proceso:', error.message);
    }
    rl.close();
  });
});
