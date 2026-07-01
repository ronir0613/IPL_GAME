const fs = require('fs');

function simulate() {
  const N = 100000;
  let perfectCount = 0;
  
  for (let i = 0; i < N; i++) {
    let streak = 0;
    let rainRuined = false;
    let destinyUsed = false;
    let won = 0;
    let played = 0;
    
    // 14 league games + 2 playoff = 16 games
    for (let game = 1; game <= 16; game++) {
      played++;
      // Rain check (only in league games)
      if (game <= 14 && Math.random() < 0.015) {
        rainRuined = true;
        break; // not 16-0
      }
      
      let momentum = 0;
      if (streak >= 12) momentum = 4;
      else if (streak >= 9) momentum = 3;
      else if (streak >= 6) momentum = 2;
      else if (streak >= 3) momentum = 1;
      
      // Assume diffA is 4 initially (user has a good team)
      let diffA = 4 + momentum; 
      // Form bonus etc let's say average 0.02
      let winProb = 0.5 + diffA * 0.03 + 0.02; 
      
      // Clutch
      if (winProb >= 0.4 && winProb <= 0.6) {
        let r = Math.random();
        if (r < 0.05) winProb = 1.0;
        else if (r < 0.10) winProb = 0.0;
      }
      
      winProb = Math.max(0, Math.min(1, winProb));
      
      let win = Math.random() < winProb;
      
      // Destiny (Perfect Season Protection)
      if (game === 16 && played === 16 && won === 15 && !win && !destinyUsed) {
        if (Math.random() < 0.20) {
          win = true;
          destinyUsed = true;
        }
      }
      
      if (win) {
        streak++;
        won++;
      } else {
        break;
      }
    }
    
    if (won === 16) {
      perfectCount++;
    }
  }
  
  console.log(`Perfect seasons in 1 Lakh players: ${perfectCount}`);
  console.log(`Probability: ${perfectCount / N}`);
}

simulate();
