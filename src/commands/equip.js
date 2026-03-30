const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "equip",
  aliases: ["equipar"],
  description: "Escolha entre equipar um personagem ou um artefato",
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Sistema de Equipamentos")
      .setDescription("O que você deseja gerenciar hoje?\n\nEscolha uma das opções abaixo para equipar um **Personagem** principal ou gerenciar os **Artefatos** de seus personagens.")
      .setColor("#0099ff")
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: "Anime Battle Arena • Selecione uma opção" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`equip_choice_char_${message.author.id}`)
        .setLabel("Equipar Personagem")
        .setEmoji("🥋")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`equip_choice_artifact_${message.author.id}`)
        .setLabel("Equipar Artefato")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Success)
    );

    await message.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
