import styles from "./index.css";

// Shadow DOM 생성
const container = document.createElement('div');
document.body.appendChild(container);

const shadowRoot = container.attachShadow({ mode: 'open' });

// Shadow DOM 내부에 컨텐츠 추가
shadowRoot.innerHTML = `
  <div class="test">Hello World-1</div>
  <div class="border border-black">Hello World-2</div>
  <style type="text/css">${styles}</style>
`;
