function RandomLetter(exclude = []) {
  const alphabet = new Array(26)
    .fill("a".charCodeAt(0))
    .map((code, id) => code + id)
    .map(code => String.fromCharCode(code));

  if (exclude.length > 0) {
    const excluded = alphabet.filter(letter => !exclude.includes(letter))

    const id = parseInt(Math.floor(Math.random() * excluded.length));
    return excluded[id];
  } else {

    const id = parseInt(Math.floor(Math.random() * alphabet.length));
    return alphabet[id];
  }
}

function RandomWord(length = 5) {
  return new Array(length).fill().map((_, __, arr) => RandomLetter(arr)).join("");
}

function ValidateRender(tree, rootElement) {
  if (!tree) {
    throw new Error("Tree is not provided");
  }

  if (!(rootElement instanceof HTMLElement)) {
    throw new Error("Expected rootElement to be HTMLElement");
  }

  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }
}

function Render(tree, rootElement) {
  ValidateRender(tree, rootElement);


  if (tree instanceof DataAdapter) {
    tree.rerender = () => Render(tree, rootElement);
    rootElement.appendChild(tree.render());
  } else {
    rootElement.appendChild(tree);
  }
}

async function RenderAsync(tree, rootElement) {
  ValidateRender(tree, rootElement);
  if (tree.render) {
    tree.rerender = () => RenderAsync(tree, rootElement);
    rootElement.appendChild(await tree.render());
  } else {
    rootElement.appendChild(await tree);
  }
}

async function fetchData() {
  let result;

  await fetch("http://localhost:3000/data.json")
    .then(response => response.json())
    .then(json => result = json)
    .catch(e => console.error(e.toString()));

  return result;
}


class DataAdapter {
  constructor(data, search = "") {
    if (!Array.isArray(data)) {
      throw new Error("Expected data to be array. Got: " + typeof data);
    }
    if (typeof search !== "string") {
      throw new Error("Expected search to be string");
    }

    this.data = data;
    this.dataKeys = (
      this.data
        .map(d => Object.keys(d))
        .reduce(
          (acc, val) => val.length > acc.length ? val : acc
        )
    );

    if (search.length > 0) {
      this.data = this.data.filter(d => {
        const keys = Object.keys(d);
        return keys.some(key => {
          return d[key].toString().substring(0, search.length) === search;
        })
      });
    }
  }

  render() {
    const container = document.createElement("div");

    const table = document.createElement("table");
    table.classList.add("table");

    const headRow = document.createElement("tr");
    headRow.classList.add("row", "head-row");

    this.dataKeys.map(key => {
      const headColumn = document.createElement("th");
      headColumn.classList.add("column");

      headColumn.appendChild(document.createTextNode(key.toString()));

      return headColumn;
    })
    .forEach(headColumn => headRow.appendChild(headColumn));

    table.appendChild(headRow);
    if (this.data.length > 0) {
      this.data.map(d => {
        const row = document.createElement("tr");
        row.classList.add("row");
  
        const keys = Object.keys(d);
  
        keys.map(key => {
          const keyColumn = document.createElement("th");
          keyColumn.classList.add("column");
  
          const value = d[key];
  
          keyColumn.appendChild(document.createTextNode(value));
  
          return keyColumn
        })
        .forEach(keyColumn => row.appendChild(keyColumn));
  
        return row;
      })
      .forEach(row => table.appendChild(row));

      container.appendChild(table);
    } else {
      const noDataInfo = document.createElement("p");
      noDataInfo.appendChild(document.createTextNode("No data found"));
      noDataInfo.classList.add("table-info");

      container.appendChild(table);
      container.appendChild(noDataInfo)
    }

    return container;
  }
}

class SearchAdapter {
  constructor(changedHandler) {
    if (typeof changedHandler === "function") {
      this.changed = changedHandler;
    }
  }

  render() {
    const container = document.createElement("div");
    container.classList.add("input-container");

    const input = document.createElement("input")
    input.type = "text";
    input.placeholder = "Hello, World!";
    input.addEventListener("input", e => this.changed(e.target.value.toString()));
    input.name = "search";

    const label = document.createElement("label");
    label.appendChild(document.createTextNode("Search data"));
    label.setAttribute("for", "search");
    container.appendChild(label);
    container.appendChild(input);

    return container;
  }
}

class AppAdapter {
  constructor() {
    this.data = [];
    this.search = "";
  }

  async render() {
    try {
      this.data = await fetchData();
    } catch (e) {
      console.error(e.toString());
    }

    const container = document.createElement("div");

    let dataAdapter = new DataAdapter(this.data, this.search).render();
    const searchAdapter = new SearchAdapter(s => {
      this.search = s;

      const newDataAdapter = new DataAdapter(this.data, this.search).render();
      container.insertBefore(newDataAdapter, dataAdapter);
      container.removeChild(dataAdapter);
      dataAdapter = newDataAdapter;
    }).render();

    container.appendChild(dataAdapter);
    container.appendChild(searchAdapter);

    return container;
  }
}

/*
const data = new Array(10).fill().map(_ => {
  return {
    name: RandomWord(),
    value: parseInt(Math.floor(Math.random() * 10))
  };
});
*/

RenderAsync(
  new AppAdapter(),
  document.getElementById("root")
);
