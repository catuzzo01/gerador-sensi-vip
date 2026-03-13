const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CREDENCIAIS SEGURAS ---
// No Render, usaremos variáveis de ambiente para estas chaves
const CLIENT_ID = process.env.MISTIC_CI;
const CLIENT_SECRET = process.env.MISTIC_CS;

const transacoes = {}; 

app.post('/api/gerar-pix', async (req, res) => {
    try {
        const { nome, cpf } = req.body;
        const idUnico = `SENSI_${Date.now()}`;

        const payload = {
            amount: 19.90,
            payerName: nome,
            payerDocument: cpf.replace(/\D/g, ''),
            transactionId: idUnico,
            description: "Desbloqueio Sensi V.I.P",
            // IMPORTANTE: Após hospedar, você deve atualizar esta URL no painel da Misticpay
            projectWebhook: "https://seu-app-no-render.onrender.com/api/webhook" 
        };

        console.log(`[SOLICITANDO] Gerando PIX para ${nome}...`);

        const response = await axios.post('https://api.misticpay.com/api/transactions/create', payload, {
            headers: {
                'ci': CLIENT_ID,
                'cs': CLIENT_SECRET,
                'Content-Type': 'application/json'
            }
        });
        
        const dadosPix = response.data.data;
        
        transacoes[dadosPix.transactionId] = 'PENDENTE';
        console.log(`[SUCESSO] QR Code gerado ID: ${dadosPix.transactionId}`);

        res.json({
            sucesso: true,
            qrCodeUrl: dadosPix.qrcodeUrl,
            copiaECola: dadosPix.copyPaste,
            idTransacao: dadosPix.transactionId
        });

    } catch (erro) {
        console.error("--- ERRO MISTICPAY ---");
        if (erro.response) {
            console.error("Resposta:", JSON.stringify(erro.response.data));
        } else {
            console.error("Erro:", erro.message);
        }
        res.status(500).json({ sucesso: false });
    }
});

app.post('/api/webhook', (req, res) => {
    const { transactionId, status } = req.body;
    if (transactionId && status === 'COMPLETO') {
        transacoes[transactionId] = 'PAGO';
        console.log(`[PAGAMENTO] Transação ${transactionId} confirmada! 💰`);
    }
    res.status(200).send('OK');
});

app.get('/api/status/:id', (req, res) => {
    const id = req.params.id;
    res.json({ status: transacoes[id] || 'NAO_ENCONTRADA' });
});

app.get('/api/simular-pagamento/:id', (req, res) => {
    const id = req.params.id;
    if(transacoes[id]) {
        transacoes[id] = 'PAGO';
        res.send(`<h1>Sucesso!</h1><p>ID ${id} simulado como pago.</p>`);
    } else {
        res.send('ID não encontrado.');
    }
});

// AJUSTE PARA HOSPEDAGEM: O Render define a porta automaticamente
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`
    ======================================
    API MISTICPAY CONECTADA (CI/CS) 💀🔥
    Servidor rodando na porta ${PORTA}
    ======================================
    `);
});