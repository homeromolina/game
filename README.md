# Gunbound All Stars 🎮

Um web game multiplayer local inspirado no clássico Gunbound. Batalhas táticas por turnos com diversos tanques, terreno destrutível, sistema de física (vento e gravidade) e power-ups dinâmicos.

## ✨ Características

*   **🕹️ 4 Tanques Exclusivos**: Cada um com status de Dano e Raio de Explosão únicos (TITAN, PHANTOM, NOVA, VENOM).
*   **🌍 Terreno Dinâmico Destrutível**: Impactos dos tiros deformam o cenário.
*   **🌪️ Sistema de Física**: O vento e a gravidade afetam diretamente a trajetória do projétil!
*   **🎯 Controle de Mira Avançado**: Ajuste de **Ângulo** e **Força** do tiro. O jogo memoriza sua calibração do turno anterior e mostra uma linha tracejada (Ghost Trail) de onde o último tiro passou.
*   **⛽ Mobilidade Limitada**: Movimente seu tanque pelo terreno, mas atenção à barra de combustível!
*   **☠️ Fall Damage**: Perde vida caso o chão abaixo do seu tanque seja destruído.
*   **🎁 Power-Ups Aleatórios nas Batalhas**: Aparecem no mapa contendo Vida (+20 HP), Boost de Força Total (MAX PWR) ou Escudo (-50% dano recebido).
*   **🚨 Modo Sudden Death**: O jogo entra em Modo Morte Súbita após 20 turnos — Todo dano é **DOBRADO** para não empatar a partida!
*   **🎥 Efeitos e Polimento Visual**: Zoom nas explosões, recuo no disparo, rastro de fogo, tremores de tela, números de dano flutuantes e festa de confetes na vitória!

## 🚀 Como baixar e jogar

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado.

### Passos
1. Faça o clone do projeto:
    ```bash
    git clone https://github.com/homeromolina/game.git
    ```
2. Entre na pasta:
    ```bash
    cd game
    ```
3. Instale as dependências e rode o servidor de desenvolvimento:
    ```bash
    npm install
    npm run dev
    ```
4. O servidor indicará uma URL (geralmente `http://localhost:5173/`). Acesse pelo seu navegador para jogar (preferencialmente Google Chrome, Edge ou Firefox).

## ⌨️ Controles do Jogo

As ações são controladas pelo teclado no seu turno:
*   **Cima / Baixo (Up/Down Arrow)**: Ajusta o Ângulo do canhão.
*   **Esquerda / Direita (Left/Right Arrow)**: Ajusta a Força do tiro.
*   **A / D**: Move o seu tanque (gasta barra de Fuel/Combustível).
*   **Barra de Espaço / Enter**: Confirmar Disparo (Fire!).

## 🛠️ Tecnologias Utilizadas
Feito inteiramente usando **React** (Vite) e renderizado de modo performático dentro do HTML5 `<canvas>`. As animações rodam direto no requestAnimationFrame em 60 FPS com Javascript Puro para cálculo de vetores balísticos e geração de terreno via curvas splines.
