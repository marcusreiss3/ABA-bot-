const EmbedManager = require("../services/EmbedManager");

module.exports = {
  async executeSair(message) {
    const userId = message.author.id;
    const party = Array.from(global.parties.values()).find(p => p.members.includes(userId));
    
    if (!party) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não está em nenhuma party.", false)] });

    if (party.leaderId === userId) {
      global.parties.delete(userId);
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você desfez a party!", true)] });
    }

    party.members = party.members.filter(id => id !== userId);
    const leaderUser = await message.client.users.fetch(party.leaderId);
    message.reply({ embeds: [EmbedManager.createStatusEmbed(`Você saiu da party de **${leaderUser.username}**.`, true)] });
  },

  async executeDesfazer(message) {
    const userId = message.author.id;
    const party = global.parties.get(userId);

    if (!party) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não é o líder de nenhuma party.", false)] });

    global.parties.delete(userId);
    message.reply({ embeds: [EmbedManager.createStatusEmbed("Party desfeita com sucesso!", true)] });
  }
};
