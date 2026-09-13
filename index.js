const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);


bot.on("message", (ctx) => {

  console.log("MESSAGE:", ctx.message);

  ctx.reply("پیام دریافت شد ✅");

});


bot.launch()
.then(() => {
  console.log("Bot Started");
})
.catch(console.log);


process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
