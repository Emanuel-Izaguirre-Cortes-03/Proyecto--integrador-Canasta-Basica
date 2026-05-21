// Test del endpoint de campañas
const API = 'http://localhost:3000/api';

async function testCampanas() {
  try {
    console.log('1. Obteniendo clientes inactivos...');
    const resClientes = await fetch(`${API}/reactivacion/clientes`);
    const dataClientes = await resClientes.json();

    console.log(`✓ Clientes inactivos encontrados: ${dataClientes.clientes.length}`);

    if (dataClientes.clientes.length === 0) {
      console.log('⚠️ No hay clientes inactivos para generar campañas');
      return;
    }

    // Tomar los primeros 3 clientes
    const clienteIDs = dataClientes.clientes.slice(0, 3).map(c => c.ClienteID);
    console.log('2. Generando campañas para clientes:', clienteIDs);

    const resCampanas = await fetch(`${API}/reactivacion/generar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteIDs })
    });

    console.log('Status:', resCampanas.status);
    const responseText = await resCampanas.text();
    console.log('Respuesta cruda:', responseText);

    const dataCampanas = JSON.parse(responseText);

    console.log(`✓ Campañas generadas: ${dataCampanas.campanas ? dataCampanas.campanas.length : 0}`);
    console.log('\n📧 CAMPAÑAS:');
    dataCampanas.campanas.forEach(c => {
      console.log(`\n  Cliente: ${c.Nombre} (ID: ${c.ClienteID})`);
      console.log(`  Categoría: ${c.CategoriaFavorita}`);
      console.log(`  Oferta: ${c.Oferta}`);
      console.log(`  Cupón: ${c.Cupon}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCampanas();
