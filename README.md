# Pixel Treta

Briga de plataforma em pixel art para 2 a 8 jogadores. O jogo roda na tela principal e cada celular vira um controle.

Versão estática (GitHub Pages): não precisa de servidor. A tela e os celulares se conectam direto por WebRTC, usando PeerJS.

## Como jogar

1. Abra `index.html` (a página do site) no computador ou TV e clique para tela cheia e som.
2. Nos celulares, aponte a câmera para o QR code. Ou abra `c.html` e digite o código da sala.
3. Lado esquerdo do celular anda (deslizar para baixo desce da plataforma), A ataca, B pula, C rola (desvia de tiros e golpes).

Último vivo ganha a rodada; 5 pontos fazem o campeão. Armas e kits caem do céu e saem das caixas; barris explodem.

- Fases: Telhado, Galpão e Cais (cuidado com a água). A fase troca a cada rodada; a tecla M troca na hora.
- Armas: soco, bastão, pistola, metralhadora, escopeta, rifle, bazuca e granada.
- Depois de 70 segundos de rodada começa a morte súbita, com bombas caindo do céu.

## Publicar

Settings → Pages → Deploy from a branch → `main` / root.
