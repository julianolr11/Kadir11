const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

// Script para adicionar golpe inicial a pets existentes
async function addInitialMovesToPets() {
    console.log('Iniciando adição de golpes iniciais aos pets...');

    // Carregar golpes disponíveis
    let allMoves = [];
    try {
        const movesData = await fs.readFile(path.join(__dirname, 'data', 'moves.json'), 'utf8');
        allMoves = JSON.parse(movesData);
        console.log(`${allMoves.length} golpes carregados`);
    } catch (err) {
        console.error('Erro ao carregar moves.json:', err);
        return;
    }

    // Diretório de pets
    const petsDir = path.join(app.getPath('userData'), 'pets');

    try {
        const files = await fs.readdir(petsDir);
        const petFiles = files.filter(file => file.startsWith('pet_') && file.endsWith('.json'));

        console.log(`Encontrados ${petFiles.length} pets`);

        let updated = 0;
        let skipped = 0;

        for (const file of petFiles) {
            const filePath = path.join(petsDir, file);

            try {
                const data = await fs.readFile(filePath, 'utf8');
                const pet = JSON.parse(data);

                // Verificar se o pet já tem golpes
                if (pet.moves && pet.moves.length > 0) {
                    console.log(`Pet ${pet.name} (${file}) já tem golpes, pulando...`);
                    skipped++;
                    continue;
                }

                // Encontrar o primeiro golpe que corresponde ao elemento do pet
                const initialMove = allMoves.find(move =>
                    move.elements && move.elements.includes(pet.element || 'puro')
                );

                if (initialMove) {
                    pet.moves = [initialMove];
                    pet.knownMoves = [initialMove];

                    await fs.writeFile(filePath, JSON.stringify(pet, null, 2), 'utf8');
                    console.log(`✓ Pet ${pet.name} (${file}) atualizado com golpe: ${initialMove.name}`);
                    updated++;
                } else {
                    console.log(`✗ Nenhum golpe encontrado para elemento ${pet.element} do pet ${pet.name}`);
                }

            } catch (err) {
                console.error(`Erro ao processar ${file}:`, err);
            }
        }

        console.log('\n=== Resumo ===');
        console.log(`Pets atualizados: ${updated}`);
        console.log(`Pets pulados (já tinham golpes): ${skipped}`);
        console.log(`Total de pets: ${petFiles.length}`);

    } catch (err) {
        console.error('Erro ao ler diretório de pets:', err);
    }
}

// Executar quando o app estiver pronto
app.whenReady().then(async () => {
    await addInitialMovesToPets();
    console.log('\nScript concluído! Você pode fechar esta janela.');
    // Não fechar automaticamente para que o usuário possa ver o resultado
});

app.on('window-all-closed', () => {
    // Não fazer nada, deixar o processo rodar
});
