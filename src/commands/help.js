"use strict";
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const COLOR = "#1a0a2e";

// ─── Páginas ──────────────────────────────────────────────────────────────────
const PAGES = [
  // 0 — Visão Geral
  {
    label: "📋 Visão Geral",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("📋 Visão Geral — Anime Battle Arena")
        .setDescription(
          `Bem-vindo ao **ABA**! Você é um **Invocador Dimensional** — ` +
          `convoca guerreiros de animes, os equipa com artefatos e os envia para batalha.\n\n` +
          `**Moedas principais:**\n` +
          `> 💠 **Fragmentos Zenith** — usados para invocar personagens no Nexus e desbloquear slots\n` +
          `> 🔮 **Fragmentos de Relíquia (FR)** — usados para forjar e comprar artefatos\n\n` +
          `**Primeiros passos:**\n` +
          `> 1. \`!equip\` — equipe um personagem para combate\n` +
          `> 2. \`!modo-historia\` — entre na sua primeira missão\n` +
          `> 3. \`!missoes\` — complete missões para ganhar recursos\n` +
          `> 4. \`!desafio\` — faça o desafio a cada hora para acumular FR\n\n` +
          `**Comandos de perfil:**\n` +
          `> \`!perfil\` — veja seu nível, PA, rank e equipamentos\n` +
          `> \`!inv\` — abre seu inventário completo`
        )
        .setFooter({ text: "Página 1 de 8 • Use o menu ou as setas para navegar" }),
  },

  // 1 — Personagens
  {
    label: "⚔️ Personagens",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("⚔️ Personagens — Gerenciar seu Plantel")
        .setDescription(
          `**\`!inv\`** — Abre seu inventário\n` +
          `> Abas: **Personagens · Artefatos · Fragmentos · Itens**\n` +
          `> Veja os slots disponíveis e expanda com Zenith\n\n` +
          `**\`!equip\`** — Equipar personagem ou artefato\n` +
          `> Selecione **Equipar Personagem** para definir seu guerreiro ativo\n` +
          `> Selecione **Equipar Artefato** para encaixar relíquias no personagem\n\n` +
          `**\`!usar\`** — Usar Pedras da Alma para evoluir personagens\n` +
          `> 🔮 **Pedra I** — XP básico · obtida em combates e missões\n` +
          `> 🔮 **Pedra II** — XP médio · missões semanais e desafios\n` +
          `> 🔮 **Pedra III** — XP avançado · marcos de progressão raros\n\n` +
          `**\`!char-info <nome>\`** — Detalhes completos de um personagem\n` +
          `> Mostra HP, energia, skills, passivas e reações\n` +
          `> Exemplo: \`!char-info goku\``
        )
        .setFooter({ text: "Página 2 de 8 • Use o menu ou as setas para navegar" }),
  },

  // 2 — Como Lutar
  {
    label: "🗡️ Como Lutar",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🗡️ Como Lutar — Sistema de Combate")
        .setDescription(
          `O combate é **por turnos**. Cada lado age alternadamente.\n\n` +
          `**Energia:**\n` +
          `> Cada skill tem um custo de energia\n` +
          `> Use **Recuperar Energia** para ganhar energia sem atacar\n` +
          `> Gerencie bem — skills poderosas custam mais\n\n` +
          `**Tipos de habilidade:**\n` +
          `> ⚔️ **Ataque** — causa dano direto\n` +
          `> 💚 **Cura** — restaura HP\n` +
          `> ✨ **Buff** — efeitos que duram turnos (dano extra, redução, etc.)\n` +
          `> 🛡️ **Reação** — ativada quando o inimigo ataca; reduz ou anula o dano\n\n` +
          `**Tipos de dano:**\n` +
          `> ⚔️ **Físico** — bloqueado por armaduras físicas\n` +
          `> 🔥 **Elemental** — bloqueado por resistências elementais\n\n` +
          `**Status negativos:**\n` +
          `> 🩸 **Sangramento** — perde % do HP máximo por turno\n` +
          `> 🔥 **Queimadura** — similar ao sangramento, origem elemental\n` +
          `> ⚡ **Atordoamento** — perde o turno`
        )
        .setFooter({ text: "Página 3 de 8 • Use o menu ou as setas para navegar" }),
  },

  // 3 — Modos de Jogo
  {
    label: "🎮 Modos de Jogo",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🎮 Modos de Jogo")
        .setDescription(
          `**📖 Modo História** \`!modo-historia\`\n` +
          `> Enfrente bosses em sequência em universos de animes\n` +
          `> Recompensas: 💠 Zenith + 🔮 Pedras da Alma\n` +
          `> *Melhor modo para iniciantes!*\n\n` +
          `**🗼 Torre Infinita** \`!torre\`\n` +
          `> Suba andares progressivos, cada um mais difícil\n` +
          `> Recompensas: 💠 Zenith crescente por andar\n\n` +
          `**🏆 Modo Desafio** \`!desafio\`\n` +
          `> 3 dificuldades: Fácil 🟢 / Médio 🟡 / Difícil 🔴\n` +
          `> Cooldown: **1 hora** por dificuldade\n` +
          `> Recompensas: 🔮 **Fragmentos de Relíquia** — essenciais para artefatos\n\n` +
          `**⚔️ PVP** \`!pvp @jogador\`\n` +
          `> Casual: desafie diretamente\n` +
          `> Ranqueado: entre na fila com \`!pvp-rank\` e suba de rank por PA\n\n` +
          `**🔥 Boss Rush** \`!boss-rush\`\n` +
          `> Um jogador vira o boss com buffs massivos, enfrenta um trio\n` +
          `> Modo cooperativo e intenso`
        )
        .setFooter({ text: "Página 4 de 8 • Use o menu ou as setas para navegar" }),
  },

  // 4 — Invocações
  {
    label: "🌀 Invocações",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("🌀 Invocações — Nexus & Fenda")
        .setDescription(
          `**💠 Nexus Zenith** \`!nexus\`\n` +
          `> Usa **Fragmentos Zenith** para invocar personagens\n` +
          `> Raridades: **EC** (Épico Comum) → **EM** (Épico Máximo)\n` +
          `> Quanto mais raro, mais poderoso o personagem\n` +
          `> Sistema de **pity**: a cada X puxadas, um personagem garantido\n\n` +
          `**🌀 Fenda Ancestral** \`!fenda\` ou \`!fenda-ancestral\`\n` +
          `> Abre portais dimensionais que trazem **fragmentos de artefatos**\n` +
          `> Chance baixa de artefato completo diretamente\n` +
          `> **Artefato em Destaque**: maior chance no pool atual\n` +
          `> Acumule **100 fragmentos** do mesmo tipo para forjar o artefato\n\n` +
          `**Como obter Zenith:**\n` +
          `> Modo História · Torre Infinita · Missões diárias/semanais\n\n` +
          `**Como obter FR:**\n` +
          `> Modo Desafio (principal fonte) · Missões`
        )
        .setFooter({ text: "Página 5 de 8 • Use o menu ou as setas para navegar" }),
  },

  // 5 — Artefatos
  {
    label: "📦 Artefatos & Relíquias",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("📦 Artefatos & Relíquias")
        .setDescription(
          `Artefatos são equipados nos seus personagens e concedem **bônus passivos** poderosos ` +
          `(dano extra, redução de dano, HP, energia e mais).\n\n` +
          `**Como obter:**\n` +
          `> 🌀 **Fenda Ancestral** \`!fenda\` — fragmentos e chance de artefato direto\n` +
          `> 🛒 **Loja de Relíquias** \`!loja-reliquias\` — compre artefatos com FR\n\n` +
          `**Forjar pelo sistema de fragmentos:**\n` +
          `> 1. Acumule **100 fragmentos** do mesmo artefato (via \`!fenda\` ou \`!desafio\`)\n` +
          `> 2. O artefato é forjado automaticamente\n` +
          `> 3. Use \`!equip\` → **Equipar Artefato** para colocar no personagem\n\n` +
          `**Slots de artefato:**\n` +
          `> Cada personagem tem **até 3 slots** de artefato\n` +
          `> Slots extras são desbloqueados com 💠 Zenith em \`!inv\`\n\n` +
          `**\`!loja-reliquias\`** — Loja com artefatos disponíveis para compra direta com FR`
        )
        .setFooter({ text: "Página 6 de 8 • Use o menu ou as setas para navegar" }),
  },

  // 6 — Missões & Rankings
  {
    label: "📜 Missões & Rankings",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("📜 Missões, Títulos & Rankings")
        .setDescription(
          `**\`!missoes\`** — Sistema de missões\n` +
          `> **Diárias** *(reiniciam todo dia)*: objetivos rápidos, recompensas em Pedras e Zenith\n` +
          `> **Semanais** *(reiniciam toda semana)*: objetivos maiores, mais Zenith e Pedras avançadas\n` +
          `> Complete as diárias todo dia — são a fonte mais consistente de recursos\n\n` +
          `**\`!titulos\`** — Conquistas desbloqueáveis\n` +
          `> Complete objetivos específicos para ganhar títulos e cargos no servidor\n\n` +
          `**\`!perfil\`** — Seu perfil completo\n` +
          `> Nível de conta, personagem equipado, rank PVP e PA\n\n` +
          `**Rankings:**\n` +
          `> \`!pvp-rank\` — Top 10 jogadores por **PA** no ranqueado\n` +
          `> \`!torre-rank\` — Top 10 jogadores pelo **andar mais alto** na Torre`
        )
        .setFooter({ text: "Página 7 de 8 • Use o menu ou as setas para navegar" }),
  },

  // 7 — Dicas & Extras
  {
    label: "💡 Dicas & Extras",
    embed: () =>
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle("💡 Dicas & Extras")
        .setDescription(
          `**Rota de farm recomendada:**\n` +
          `> 1️⃣ \`!modo-historia\` — progressão inicial, Zenith e XP\n` +
          `> 2️⃣ \`!torre\` — suba andares para upar personagens\n` +
          `> 3️⃣ \`!desafio\` *(1x por hora)* — principal fonte de FR para artefatos\n` +
          `> 4️⃣ \`!missoes\` — complete diariamente para bônus consistentes\n` +
          `> 5️⃣ \`!pvp\` — quando estiver preparado, suba de rank\n\n` +
          `**Outros comandos úteis:**\n` +
          `> \`!codigo <CÓDIGO>\` — resgate códigos promocionais\n` +
          `> \`!pvp-rank\` — veja o ranking PVP\n` +
          `> \`!torre-rank\` — veja o ranking da Torre\n` +
          `> \`!char-info <nome>\` — detalhes de qualquer personagem\n\n` +
          `**Dicas rápidas:**\n` +
          `> ⚠️ Não aplique Pedras da Alma no Gojo do tutorial — ele é temporário\n` +
          `> 💡 Artefatos fazem grande diferença — priorize o \`!desafio\` todo dia\n` +
          `> 💡 Evolua um personagem principal antes de distribuir pedras`
        )
        .setFooter({ text: "Página 8 de 8 • Use o menu ou as setas para navegar" }),
  },
];

// ─── Componentes ──────────────────────────────────────────────────────────────
function buildComponents(userId, page) {
  const nav = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev_${userId}_${page}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`help_next_${userId}_${page}`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === PAGES.length - 1),
  );

  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`help_select_${userId}`)
      .setPlaceholder("📂 Ir para uma categoria...")
      .addOptions(
        PAGES.map((p, i) => ({
          label: p.label,
          value: String(i),
          default: i === page,
        }))
      )
  );

  return [nav, select];
}

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
  execute: async (message) => {
    const userId = message.author.id;
    const embed = PAGES[0].embed();
    await message.reply({ embeds: [embed], components: buildComponents(userId, 0) });
  },

  handleInteraction: async (interaction) => {
    const id = interaction.customId;
    const userId = interaction.user.id;

    let page = null;

    if (id.startsWith("help_prev_") || id.startsWith("help_next_")) {
      const parts = id.split("_");
      const interactorId = parts[2];
      const currentPage = parseInt(parts[3]);
      if (interactorId !== userId) {
        return interaction.reply({ content: "Este menu não é seu!", ephemeral: true });
      }
      page = id.startsWith("help_prev_") ? currentPage - 1 : currentPage + 1;
    }

    if (id.startsWith("help_select_")) {
      const interactorId = id.slice("help_select_".length);
      if (interactorId !== userId) {
        return interaction.reply({ content: "Este menu não é seu!", ephemeral: true });
      }
      page = parseInt(interaction.values[0]);
    }

    if (page === null || page < 0 || page >= PAGES.length) return;

    await interaction.update({
      embeds: [PAGES[page].embed()],
      components: buildComponents(userId, page),
    });
  },
};
