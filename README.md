# `xstro`

> \[!IMPORTANT]
> **Use at Your Own Risk**
> WhatsApp’s [Terms of Service](https://www.whatsapp.com/legal/terms-of-service) explicitly **prohibit the use of unauthorized third-party automation tools or software** that interact with its platform. This includes bots, automation frameworks, and reverse-engineered clients. Violating these terms can result in your account being **permanently banned** or facing legal action.
>
> Additionally, always be vigilant against **scammers** and **social engineering attacks**. I will never ask for your WhatsApp session, QR code, token, or any sensitive credential—**you are fully responsible** for your data and actions while using this software.
>
> By choosing to use this project, you acknowledge and accept all associated risks and liabilities.
>
> It is a simple, open-source, fast, and reliable WhatsApp automation system that operates via the Baileys Web API to send, receive, manage, and process various WhatsApp-related events.

For more information about Baileys, see:
[https://github.com/WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)

## Deployment

Once the deployment is complete and the bot starts, it will generate a local pairing code. You’ll be required to enter this code to connect the bot to your WhatsApp account.

<a href='https://www.heroku.com/deploy?template=https://github.com/AstroX11/Xstro' target="_blank"><img alt='DEPLOY' src='https://img.shields.io/badge/-Heroku-black?style=for-the-badge&logo=heroku&logoColor=white'/></a>

<a href='https://app.koyeb.com/deploy?name=xstro&repository=AstroX11%2FXstro&branch=stable&builder=dockerfile&instance_type=free&instances_min=0&autoscaling_sleep_idle_delay=300&env%5BUSER_NUMBER%5D=' target="_blank"><img alt='DEPLOY' src='https://img.shields.io/badge/-Koyeb-black?style=for-the-badge&logo=koyeb&logoColor=white'/></a>

<a href='https://render.com/deploy?repo=https://github.com/AstroX11/Xstro' target="_blank"><img alt='DEPLOY' src='https://img.shields.io/badge/-Render-black?style=for-the-badge&logo=render&logoColor=white'/></a>

<a href='https://pterodactyl.io/' target="_blank"><img alt='DEPLOY' src='https://img.shields.io/badge/-Panel-black?style=for-the-badge&logo=pterodactyl&logoColor=white'/></a>

<a href='https://replit.com/github/AstroX11/Xstro' target="_blank"><img alt='DEPLOY' src='https://img.shields.io/badge/-Replit-black?style=for-the-badge&logo=Replit&logoColor=white'/></a>

## RUN ON VPS/UBUNTU/WINDOWS

1. Install NodeJs 23, ffmpeg
2. Installation

   ```bash
   npm i -global pnpm
   git clone https://github.com/AstroX11/Xstro.git
   cd Xstro
   pnpm install
   ```

3. Configuration

   ```bash
   echo "USER_NUMBER=" > config.env
   ```

- Start

  ```bash
  pnpm start
  ```
