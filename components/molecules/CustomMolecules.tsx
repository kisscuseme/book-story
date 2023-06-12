// Accordion 스타일 오버라이딩 (더 나은 방법 찾는 중)
export const accordionCustomStyle = `
  .accordion {
    background-color: transparent;
  }

  .accordion-header {
    background-color: transparent;
  }

  .accordion-item {
    background-color: transparent;
    border: 0;
  }

  .accordion-button {
    background-color: transparent;
    border: 0 !important;
    padding: 5px 0;
    --bs-accordion-border-width: 0;
  }

  .accordion-button:focus {
    outline: 0;
    border: 0;
    box-shadow: unset;
  }
  
  .accordion-button:active {
    outline: none;
    border: none;
  }

  .accordion-button:not(.collapsed) {
    color: #3e3e3e;
    --bs-accordion-active-bg: transparent;
  }

  .accordion-button:hover {
    color: #5e5e5e;
  }
  
  .accordion-button::after {
    all: unset;
  }

  .accordion-body {
    padding: 5px 0;
  }
  .accordion-collapse .collapsing {
    overflow: auto;
  }
`;
