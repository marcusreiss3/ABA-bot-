class Battle {
  /**
   * @param {Object} data
   * @param {string} data.id - ID único da batalha (geralmente gerado)
   * @param {string} data.player1Id - ID do jogador 1
   * @param {string} data.player2Id - ID do jogador 2
   * @param {import('./Character')} data.character1 - Instância do personagem do jogador 1
   * @param {import('./Character')} data.character2 - Instância do personagem do jogador 2
   * @param {string[]} data.turnOrder - Ordem dos IDs de jogadores
   * @param {string} data.currentPlayerTurnId - ID do jogador que está no turno
   * @param {string} data.state - Estado atual ('choosing_action', 'choosing_reaction', 'finished')
   * @param {string} [data.lastActionMessage] - Mensagem descritiva da última ação realizada
   */
  constructor(data) {
    this.id = data.id;
    this.player1Id = data.player1Id;
    this.player2Id = data.player2Id;
    this.character1 = data.character1;
    this.character2 = data.character2;
    this.turnOrder = data.turnOrder;
    this.currentPlayerTurnId = data.currentPlayerTurnId;
    this.state = data.state || "choosing_action";
    this.lastActionMessage = data.lastActionMessage || "";
    this.lastEmbedMessageId = null;
    this.winnerId = null;
    this.lastPendingDamage = 0; // ✅ Adicionado para mostrar dano na reação
    this.lastPendingSkill = null; // ✅ Adicionado para saber qual skill está sendo usada
  }

  getCurrentPlayer() {
    if ((this.isPve || this.type === "boss-rush") && this.partyCharacters) {
      const char = this.partyCharacters.find(c => c.ownerId === this.currentPlayerTurnId);
      if (char) return char;
    }
    return this.currentPlayerTurnId === this.player1Id ? this.character1 : this.character2;
  }

  getOpponentPlayer() {
    if (this.type === "boss-rush") {
      if (this.currentPlayerTurnId === this.player1Id) {
        // Boss ataca o alvo atual (definido no turno ou padrão)
        const target = this.partyCharacters.find(c => c.ownerId === this.player2Id);
        return target || this.character2;
      } else {
        // Jogador do time ataca o Boss
        return this.character1;
      }
    }
    if (this.isPve) {
      if (this.currentPlayerTurnId !== this.player2Id) return this.character2;
      return this.character1; 
    }
    return this.currentPlayerTurnId === this.player1Id ? this.character2 : this.character1;
  }

  getOpponentId() {
    if (this.type === "boss-rush") {
      if (this.currentPlayerTurnId === this.player1Id) return this.player2Id;
      return this.player1Id;
    }
    if (this.isPve) {
      if (this.currentPlayerTurnId !== this.player2Id) return this.player2Id;
      return this.player1Id;
    }
    return this.currentPlayerTurnId === this.player1Id ? this.player2Id : this.player1Id;
  }

  switchTurn() {
    const currentIndex = this.turnOrder.indexOf(this.currentPlayerTurnId);
    const nextIndex = (currentIndex + 1) % this.turnOrder.length;
    this.currentPlayerTurnId = this.turnOrder[nextIndex];
  }
}

module.exports = Battle;
