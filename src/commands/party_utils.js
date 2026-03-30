module.exports = {
  async executeSair(message) {
    const userId = message.author.id;
    const party = Array.from(global.parties.values()).find(p => p.members.includes(userId));
    
    if (!party) return message.reply("❌ Você não está em nenhuma party.");

    if (party.leaderId === userId) {
      global.parties.delete(userId);
      return message.reply("✅ Você desfez a party!");
    }

    party.members = party.members.filter(id => id !== userId);
    message.reply(`✅ Você saiu da party de **${(await message.client.users.fetch(party.leaderId)).username}**.`);
  },

  async executeDesfazer(message) {
    const userId = message.author.id;
    const party = global.parties.get(userId);

    if (!party) return message.reply("❌ Você não é o líder de nenhuma party.");

    global.parties.delete(userId);
    message.reply("✅ Party desfeita com sucesso!");
  }
};
