export interface TimelineCardConfig {
  compactUntilZoom: number;
  compactFocusZoomOffset: number;
  maxRowsPerSide: number;
  rowStep: number;
  minRowStep: number;
  denseRowStep: number;
  gap: number;
  width: number;
  narrowWidth: number;
  narrowBreakpoint: number;
}

export interface TimelineZoomConfig {
  buttonStep: number;
  wheelSensitivity: number;
  minLevel: number;
  maxLevel: number;
  minAbsoluteScale: number;
  hiddenEventsStep: number;
}

export interface TimelineLayoutConfig {
  axisGapEstimate: number;
  edgePadding: number;
  extraRightPadding: number;
  minFitWidth: number;
  viewMargin: number;
  smallScreenWidth: number;
  initialMobileZoom: number;
  initialMobileMinScale: number;
  viewSaveDelay: number;
}

export interface TimelineConfig {
  cards: TimelineCardConfig;
  zoom: TimelineZoomConfig;
  layout: TimelineLayoutConfig;
}

export const TIMELINE_CONFIG: TimelineConfig = {
  cards: {
    // Até este nível de zoom (inclusive), os cards aparecem no modo compacto.
    compactUntilZoom: 200,
    // Ao clicar em um card compacto, o zoom pula para compactUntilZoom + este valor.
    compactFocusZoomOffset: 1,
    // Quantidade máxima de faixas de cards acima e abaixo do eixo.
    maxRowsPerSide: 5,
    // Altura máxima de cada faixa compacta, em pixels.
    rowStep: 128,
    // Altura mínima das faixas; o layout reduz o passo para tentar manter todas visíveis.
    minRowStep: 80,
    // Abaixo deste passo vertical, os cards compactos ativam o modo denso.
    denseRowStep: 112,
    // Distância horizontal entre cards na mesma faixa, em pixels.
    gap: 26,
    // Largura dos cards em telas normais, em pixels.
    width: 304,
    // Largura dos cards em telas estreitas, em pixels.
    narrowWidth: 264,
    // Largura da tela em que os cards passam a usar narrowWidth.
    narrowBreakpoint: 680,
  },
  zoom: {
    // Quanto cada clique em + ou - adiciona ou remove do nível de zoom.
    buttonStep: 1,
    // Sensibilidade do zoom por scroll; valores maiores ampliam mais rápido.
    wheelSensitivity: 0.0025,
    // Nível mínimo de zoom em relação ao enquadramento geral.
    minLevel: 0.85 / 3,
    // Nível máximo de zoom em relação ao enquadramento geral.
    maxLevel: 400,
    // Escala absoluta mínima para telas ou timelines muito extensas.
    minAbsoluteScale: 0.001,
    // Fator de zoom ao clicar no indicador de eventos ocultos.
    hiddenEventsStep: 1.8,
  },
  layout: {
    // Distância estimada entre o eixo central e a primeira faixa de cards.
    axisGapEstimate: 38,
    // Espaço horizontal extra nas bordas da linha do tempo.
    edgePadding: 48,
    // Espaço horizontal adicional no lado direito.
    extraRightPadding: 24,
    // Largura mínima usada no cálculo do enquadramento geral.
    minFitWidth: 140,
    // Margem vertical reservada para as faixas de cards.
    viewMargin: 24,
    // Largura de tela que ativa o enquadramento inicial para telas pequenas.
    smallScreenWidth: 720,
    // Multiplicador de zoom inicial em telas pequenas.
    initialMobileZoom: 3,
    // Escala absoluta mínima do zoom inicial em telas pequenas.
    initialMobileMinScale: 2.4,
    // Atraso em milissegundos para salvar zoom e posição no localStorage.
    viewSaveDelay: 180,
  },
};
