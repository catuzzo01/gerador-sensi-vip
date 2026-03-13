const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Buscando chaves no cofre do Render (Environment Variables)
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
            // ATUALIZE O LINK ABAIXO:
            projectWebhook: "https://SUA-API-NO-RENDER.onrender.com/api/webhook" 
        };

        const response = await axios.post('https://api.misticpay.com/api/transactions/create', payload, {
            headers: {
                'ci': CLIENT_ID, // Conforme documentação MisticPay
                'cs': CLIENT_SECRET, 
                'Content-Type': 'application/json'
            }
        });
        
        const dadosPix = response.data.data;
        transacoes[dadosPix.transactionId] = 'PENDENTE';

        res.json({
            sucesso: true,
            qrCodeUrl: dadosPix.qrcodeUrl,
            copiaECola: dadosPix.copyPaste,
            idTransacao: dadosPix.transactionId
        });

    } catch (erro) {
        console.error("Erro MisticPay:", erro.response ? erro.response.data : erro.message);
        res.status(500).json({ sucesso: false });
    }
});

app.post('/api/webhook', (req, res) => {
    const { transactionId, status } = req.body;
    if (transactionId && status === 'COMPLETO') {
        transacoes[transactionId] = 'PAGO';
    }
    res.status(200).send('OK');
});

app.get('/api/status/:id', (req, res) => {
    const id = req.params.id;
    res.json({ status: transacoes[id] || 'NAO_ENCONTRADA' });
});

// Porta automática para hospedagem
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`Servidor Online na porta ${PORTA} 💀🔥`);
});