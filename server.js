const express = require('express');
const axios = require('axios');
const { MACD } = require('technicalindicators');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Função para buscar todas as moedas listadas na Binance
async function getSymbols() {
    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    return response.data.symbols
        .filter(symbol => symbol.status === 'TRADING' && symbol.quoteAsset === 'USDT')
        .map(symbol => symbol.symbol);
}

// Função para buscar dados de candles de uma moeda específica
async function getCandles(symbol) {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
            symbol: symbol,
            interval: '1h',
            limit: 100
        }
    });
    return response.data.map(candle => parseFloat(candle[4])); // Fechamento do candle
}

// Função para calcular o MACD e verificar o histograma
function calculateMACD(closes) {
    const input = {
        values: closes,
        fastPeriod: 3,
        slowPeriod: 10,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    };
    const macd = MACD.calculate(input);
    return macd.length > 0 ? macd[macd.length - 1].histogram : null;
}

// Função para buscar símbolos com histogramas do MACD
async function getSymbolsWithHistogram() {
    const symbols = await getSymbols();
    const symbolsWithHistogram = await Promise.all(symbols.map(async (symbol) => {
        try {
            const closes = await getCandles(symbol);
            const histogram = calculateMACD(closes);
            return histogram !== null ? { symbol, histogram } : null;
        } catch (error) {
            console.error(`Erro ao processar ${symbol}:`, error.message);
            return null;
        }
    }));

    return symbolsWithHistogram.filter(item => item !== null);
}

// Rota para buscar moedas "vermelhas"
app.get('/red-symbols', async (req, res) => {
    try {
        const symbolsWithHistogram = await getSymbolsWithHistogram();
        const redSymbols = symbolsWithHistogram
            .filter(item => item.histogram < 0) // Filtra apenas os que têm histograma negativo
            .map(item => `${item.symbol} -${item.histogram.toFixed(2)}`); // Formata a resposta

        res.json(redSymbols);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar símbolos' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
