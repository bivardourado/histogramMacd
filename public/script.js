//script.js

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/red-coins')
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById('red-coins-container');
        
        if (data.length === 0) {
          container.innerHTML = '<p>Não há moedas vermelhas no momento.</p>';
          return;
        }
  
        const list = document.createElement('ul');
        data.forEach(coin => {
          const listItem = document.createElement('li');
          listItem.textContent = `Moeda: ${coin.symbol}, Histograma: ${coin.histogram.toFixed(4)}`;
          list.appendChild(listItem);
        });
  
        container.appendChild(list);
      })
      .catch(error => {
        console.error('Erro ao buscar moedas vermelhas:', error);
      });
  });
  