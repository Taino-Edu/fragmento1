# FRAGMENT 01 // NULL ENTROP

> "O sistema não falhou. Ele evoluiu para algo que você não consegue controlar."

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-WIP-orange.svg) ![Tech](https://img.shields.io/badge/tech-React%20%7C%20TypeScript%20%7C%20WebAudio-purple.svg)

## 📡 Sobre o Projeto

**FRAGMENT 01** é um jogo tático de matrizes (Grid-Based Strategy) ambientado no universo **Mindpunk**. O jogador navega por sistemas corrompidos, enfrenta entidades de segurança e manipula o ambiente através de código e combate tático.

Diferente de jogos tradicionais, a trilha sonora e o ambiente reagem procedimentalmente ao estado do jogo, criando uma experiência de imersão industrial e caótica.

## 🛠️ Tecnologias & Arquitetura

O projeto foi construído com foco em performance e modularidade, utilizando **React** e **TypeScript** de forma agressiva para lógica de jogos.

### Core Stack
* **Engine:** React + TypeScript (Vite)
* **State Management:** Zustand (Arquitetura de Slices)
* **Audio:** Web Audio API (SoundEngine Procedural Customizada)
* **Styling:** CSS Modules / CSS Variables para temas dinâmicos

### Estrutura do Sistema (`src/`)
* **`logic/`**: O "cérebro" do jogo. Contém algoritmos puros de *Pathfinding* (A*), IA de inimigos, combate e geração procedural de mapas.
* **`store/`**: Gerenciamento de estado global reativo.
* **`utils/soundEngine.ts`**: Sintetizador de áudio em tempo real capaz de gerar Doom Metal, Synthwave e Glitchcore sem arquivos de áudio externos.
* **`components/`**: Camada visual separada entre `Game` (Grid, Entidades) e `UI` (HUD, Logs, Terminais).

## 🎧 Procedural Sound Engine (V5.0)

O destaque técnico do projeto. Uma engine de áudio híbrida que gera música em tempo real baseada na tensão do gameplay.

| Protocolo | Estilo Musical | Gatilho |
| :--- | :--- | :--- |
| **DOOM MARCH** | Industrial Metal | Combate Pesado / Boss |
| **NEON CHASE** | Synthwave / Cyberpunk | Fugas e Timer Ativo |
| **SYSTEM FAILURE** | Breakcore / Glitch | Erros Críticos / HP Baixo |
| **VOID SIGNAL** | Dark Ambient | Exploração e Menus |

## 🚀 Como Rodar Localmente

Certifique-se de ter o **Node.js** instalado.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/Taino-Edu/fragmento1.git](https://github.com/Taino-Edu/fragmento1.git)
    ```

2.  **Entre na pasta do fragmento:**
    ```bash
    cd fragmento1/mindpunk-fragment-01
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

5.  Acesse `http://localhost:5173` e inicie a conexão.

## 🗺️ Roadmap

- [x] **Grid System:** Renderização e movimentação baseada em matrizes.
- [x] **Core Combat:** Sistema de ataque, defesa e turnos.
- [x] **Sound Engine V5:** Geração de áudio procedural complexa.
- [ ] **Deck Building:** Sistema de "Cartas de Código" para habilidades.
- [ ] **ProcGen Maps:** Algoritmo de geração de mapas tipo "Dungeon".
- [ ] **Save System:** Persistência local do progresso.

## 🤝 Contribuição

Este é um projeto pessoal de estudo e desenvolvimento de portfólio. Sugestões e PRs são bem-vindos para quem quiser explorar o código.

---

<p align="center">
  Desenvolvido por <a href="https://github.com/Taino-Edu">Eduardo Taino</a><br>
  <i>"Reality is just a deprecated variable."</i>
</p>
