const playerRepository = require("../database/repositories/playerRepository");

const RANKS = [
  "Discípulo III", "Discípulo II", "Discípulo I",
  "Desperto III", "Desperto II", "Desperto I",
  "Vanguardista III", "Vanguardista II", "Vanguardista I",
  "Ascendente III", "Ascendente II", "Ascendente I",
  "Transcendente"
];

class RankManager {
  getRankIndex(rankName) {
    return RANKS.indexOf(rankName);
  }

  canFight(rank1, rank2) {
    const idx1 = this.getRankIndex(rank1);
    const idx2 = this.getRankIndex(rank2);
    
    // Categorias: Discípulo (0,1,2), Desperto (3,4,5), etc.
    const cat1 = Math.floor(idx1 / 3);
    const cat2 = Math.floor(idx2 / 3);
    
    // Diferença de até 1 categoria (ex: Discípulo pode lutar contra Desperto)
    return Math.abs(cat1 - cat2) <= 1;
  }

  updatePA(playerId, isWin) {
    const player = playerRepository.getPlayer(playerId);
    let currentPA = player.pa || 0;
    let currentRankIdx = this.getRankIndex(player.rank || "Discípulo III");

    if (isWin) {
      currentPA += 20;
    } else {
      currentPA = Math.max(0, currentPA - 15);
    }

    // Lógica de subida de rank (100 PA para o próximo)
    if (currentPA >= 100 && currentRankIdx < RANKS.length - 1) {
      currentPA -= 100;
      currentRankIdx++;
    }

    playerRepository.updatePlayer(playerId, {
      pa: currentPA,
      rank: RANKS[currentRankIdx]
    });

    return { pa: currentPA, rank: RANKS[currentRankIdx] };
  }

  getRankList() {
    return RANKS;
  }
}

module.exports = new RankManager();
