const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "equip",
  aliases: ["equipar"],
  description: "Escolha entre equipar um personagem ou um artefato",
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setTitle("⚔️ Câmara de Equipamentos")
      .setDescription(
        `> *\"Aquele que escolhe bem suas armas, já venceu metade da batalha.\"*\n\n` +
        `**${message.author.username}**, o que deseja preparar para o combate?`
      )
      .setColor("#1a1a2e")
      .setThumbnail(message.author.displayAvatarURL())
      .addFields(
        { name: "🥋 Combatente",  value: "Defina seu guerreiro principal",       inline: true },
        { name: "🛡️ Relíquias",   value: "Gerencie artefatos dos personagens",   inline: true },
        { name: "🎖️ Título",      value: "Exiba sua conquista no perfil",        inline: true }
      )
      .setFooter({ text: "Anime Battle Arena • Câmara de Equipamentos" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`equip_choice_char_${message.author.id}`)
        .setLabel("Combatente")
        .setEmoji("🥋")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`equip_choice_artifact_${message.author.id}`)
        .setLabel("Relíquias")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`equip_choice_title_${message.author.id}`)
        .setLabel("Título")
        .setEmoji("🎖️")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [row] });
  }
};
