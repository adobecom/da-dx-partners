// Scrolling ASCII Text Banner in a 10x50 field of '0's
(function () {
  const message = 'hit the code!';
  const fieldRows = 10;
  const fieldCols = 50;
  const textRow = 5; // 0-based index, so row 6
  let offset = 0;

  function renderFrame(target) {
    if (target) {
      // Create a field of '0's
      const field = Array.from({ length: fieldRows }, () => '0'.repeat(fieldCols).split(''));
      // Calculate where the message should start
      const start = offset;
      for (let i = 0; i < message.length; i++) {
        const col = (start + i) % fieldCols;
        field[textRow][col] = message[i];
      }
      // Join the field into a string
      target.asciiDiv.textContent = field.map(row => row.join('')).join('\n');
      offset = (offset + 1) % fieldCols;
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const target = document.getElementById('regression-test');
      // Create and insert h2
      const h2 = document.createElement('h2');
      h2.textContent = 'regression test stage';
      h2.style.margin = '0 0 10px 0';
      // Create a div for ASCII art
      const asciiDiv = document.createElement('div');
      asciiDiv.style.fontFamily = 'monospace';
      asciiDiv.style.whiteSpace = 'pre';
      target.appendChild(h2);
      target.appendChild(asciiDiv);
      // Store asciiDiv on target for easy access
      target.asciiDiv = asciiDiv;
      setInterval(() => renderFrame(target), 80);
      renderFrame(target);
    });
  }
})();
