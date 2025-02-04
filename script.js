// =====================
// VARIÁVEIS GLOBAIS
// =====================
let allPokemonList = [];      // Lista dos 1000 Pokémon (dados básicos)
let pokemonDataCache = {};    // Cache para detalhes já buscados
let currentIndex = 0;         // Índice para carregamento em lotes
const batchSize = 50;         // Tamanho do lote
let currentLanguage = localStorage.getItem("language") || "pt";

// =====================
// TRADUÇÕES DA INTERFACE
// =====================
const translations = {
  pt: {
    siteTitle: "Marcelol Pokedex",
    searchPlaceholder: "Pesquise por nome ou número do Pokémon...",
    loadMore: "Carregar Mais",
    info: "Info",
    back: "Voltar",
    weight: "Peso",
    height: "Altura",
    curiosity: "Curiosidades",
    evolutions: "Evoluções"
  },
  en: {
    siteTitle: "Marcelol Pokedex",
    searchPlaceholder: "Search by Pokémon name or number...",
    loadMore: "Load More",
    info: "Info",
    back: "Back",
    weight: "Weight",
    height: "Height",
    curiosity: "Curiosity",
    evolutions: "Evolutions"
  },
  es: {
    siteTitle: "Marcelol Pokedex",
    searchPlaceholder: "Busca por nombre o número...",
    loadMore: "Cargar Más",
    info: "Info",
    back: "Volver",
    weight: "Peso",
    height: "Altura",
    curiosity: "Curiosidades",
    evolutions: "Evoluciones"
  },
  ja: {
    siteTitle: "Marcelol Pokedex",
    searchPlaceholder: "ポケモンの名前または番号で検索...",
    loadMore: "Load More", // Pode ser ajustado se desejar tradução para o japonês
    info: "Info",
    back: "Back",
    weight: "Weight",
    height: "Height",
    curiosity: "Curiosity",
    evolutions: "Evolutions"
  }
};

function applyTranslations() {
  const texts = translations[currentLanguage];
  // Página principal
  const siteTitle = document.getElementById("site-title");
  if (siteTitle) siteTitle.textContent = texts.siteTitle;
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.placeholder = texts.searchPlaceholder;
  const loadMoreBtn = document.getElementById("load-more");
  if (loadMoreBtn) loadMoreBtn.textContent = texts.loadMore;
  const infoButtons = document.querySelectorAll(".info-btn");
  infoButtons.forEach(btn => btn.textContent = texts.info);
  // Página de detalhes
  const infoTitle = document.getElementById("info-title");
  if (infoTitle) infoTitle.textContent = "Detalhes do Pokémon"; // Nome fixo conforme pedido
  const backButton = document.querySelector(".back-button");
  if (backButton) backButton.textContent = texts.back;
}

// =====================
// FUNÇÕES DE IDIOMA
// =====================
function changeLanguage() {
  const selected = document.getElementById("languages").value;
  currentLanguage = selected;
  localStorage.setItem("language", currentLanguage);
  applyTranslations();
}
function changeLanguageInfo() {
  const selected = document.getElementById("languages-info").value;
  currentLanguage = selected;
  localStorage.setItem("language", currentLanguage);
  applyTranslations();
  if (document.getElementById("pokemon-info")) loadPokemonDetails();
}

// =====================
// FUNÇÕES DA POKEDEX (INDEX)
// =====================

// Busca a lista completa de 1000 Pokémon
function fetchAllPokemonList() {
  fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000&offset=0`)
    .then(res => res.json())
    .then(data => {
      allPokemonList = data.results;
      loadNextBatch();
    })
    .catch(err => console.error("Erro ao buscar a lista de Pokémon:", err));
}

// Carrega o próximo lote (batch) de 50 Pokémon
function loadNextBatch() {
  const end = Math.min(currentIndex + batchSize, allPokemonList.length);
  const batch = allPokemonList.slice(currentIndex, end);
  batch.forEach(pokemon => fetchPokemonDetails(pokemon.url));
  currentIndex = end;
  if (currentIndex >= allPokemonList.length) {
    document.getElementById("load-more").style.display = "none";
  }
}

// Busca os detalhes de um Pokémon e guarda no cache
function fetchPokemonDetails(url) {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      pokemonDataCache[data.name] = data;
      displayPokemon(data);
    })
    .catch(err => console.error("Erro ao buscar detalhes:", err));
}

// Cria e adiciona um card de Pokémon à grid
function displayPokemon(data) {
  const container = document.getElementById("pokedex");
  if (document.getElementById(`card-${data.id}`)) return; // Evita duplicação
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  card.id = `card-${data.id}`;
  const texts = translations[currentLanguage];
  // Monta a seção de tipos
  let typesHTML = `<div class="types-container">`;
  data.types.forEach(typeObj => {
    const typeName = typeObj.type.name.charAt(0).toUpperCase() + typeObj.type.name.slice(1);
    typesHTML += `<span class="type">${typeName}</span>`;
  });
  typesHTML += `</div>`;
  card.innerHTML = `
    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png" alt="${data.name}">
    <h2>${data.name.charAt(0).toUpperCase() + data.name.slice(1)}</h2>
    <p>#${data.id.toString().padStart(3, '0')}</p>
    ${typesHTML}
    <a href="info.html?pokemon=${data.name}" class="info-btn">${texts.info}</a>
  `;
  container.appendChild(card);
}

// Filtra os Pokémon por nome ou número
function searchPokemon() {
  const query = document.getElementById("search").value.toLowerCase().trim();
  const container = document.getElementById("pokedex");
  container.innerHTML = "";
  const filtered = allPokemonList.filter(p => {
    const id = p.url.split('/').filter(Boolean).pop();
    return p.name.includes(query) || id.includes(query);
  });
  filtered.forEach(pokemon => {
    if (pokemonDataCache[pokemon.name]) {
      displayPokemon(pokemonDataCache[pokemon.name]);
    } else {
      fetchPokemonDetails(pokemon.url);
    }
  });
}

// =====================
// FUNÇÕES DA PÁGINA DE DETALHES (INFO)
// =====================
function loadPokemonDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const pokemonName = urlParams.get("pokemon");
  if (!pokemonName) return;
  fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
    .then(res => res.json())
    .then(data => {
      // Busca também os dados da espécie para flavor text e evolução
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`)
        .then(res => res.json())
        .then(species => {
          let flavorEntry = species.flavor_text_entries.find(entry => entry.language.name === currentLanguage)
            || species.flavor_text_entries.find(entry => entry.language.name === "pt")
            || species.flavor_text_entries.find(entry => entry.language.name === "en");
          const flavorText = flavorEntry ? flavorEntry.flavor_text.replace(/\f|\n/g, " ") : "Sem curiosidades.";
          if (species.evolution_chain) {
            fetch(species.evolution_chain.url)
              .then(res => res.json())
              .then(evoData => {
                const chain = [];
                let current = evoData.chain;
                while (current) {
                  chain.push(current.species);
                  current = current.evolves_to[0];
                }
                let evolutionHTML = `<div class="pokemon-evolutions">`;
                chain.forEach((specie, index) => {
                  const evoId = specie.url.split('/').filter(Boolean).pop();
                  evolutionHTML += `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evoId}.png" alt="${specie.name}">`;
                  if (index < chain.length - 1) {
                    evolutionHTML += `<span class="evolution-arrow">&#8594;</span>`;
                  }
                });
                evolutionHTML += `</div>`;
                updateInfoPage(data, flavorText, evolutionHTML);
              })
              .catch(err => {
                console.error("Erro na cadeia evolutiva:", err);
                updateInfoPage(data, flavorText, "");
              });
          } else {
            updateInfoPage(data, flavorText, "");
          }
        })
        .catch(err => {
          console.error("Erro ao buscar dados da espécie:", err);
          updateInfoPage(data, "Sem curiosidades.", "");
        });
    })
    .catch(err => {
      console.error("Erro ao carregar detalhes do Pokémon:", err);
      document.getElementById("pokemon-info").innerHTML = "<p>Erro ao carregar os detalhes.</p>";
    });
}

function updateInfoPage(data, flavorText, evolutionHTML) {
  const texts = translations[currentLanguage];
  const infoContainer = document.getElementById("pokemon-info");
  infoContainer.innerHTML = `
    <h2>${data.name.charAt(0).toUpperCase() + data.name.slice(1)}</h2>
    <img src="${data.sprites.front_default}" alt="${data.name}">
    <p class="pokemon-detail"><strong>${texts.weight}:</strong> ${(data.weight / 10).toFixed(1)} kg</p>
    <p class="pokemon-detail"><strong>${texts.height}:</strong> ${(data.height / 10).toFixed(1)} m</p>
    <p class="pokemon-detail"><strong>${texts.curiosity}:</strong> ${flavorText}</p>
    <h3>${texts.evolutions}</h3>
    ${evolutionHTML}
  `;
}

// =====================
// INICIALIZAÇÃO
// =====================
document.addEventListener("DOMContentLoaded", () => {
  currentLanguage = localStorage.getItem("language") || "pt";
  applyTranslations();
  if (document.getElementById("languages"))
    document.getElementById("languages").value = currentLanguage;
  if (document.getElementById("languages-info"))
    document.getElementById("languages-info").value = currentLanguage;
    
  if (document.getElementById("pokedex")) {
    fetchAllPokemonList();
    document.getElementById("load-more").addEventListener("click", loadNextBatch);
    document.getElementById("search").addEventListener("input", searchPokemon);
  }
  if (document.getElementById("pokemon-info")) {
    loadPokemonDetails();
  }
});
