const button = document.getElementById('fetch-pokemon');
button.addEventListener("click", renderPage);
function renderPage(e) {
    e.preventDefault();
    const searchCategory = document.getElementById("search-category").value;    //stores dropdown value
    const input = document.getElementById("input").value.toLowerCase();     //stores input text as lowercase
    const evolutionCheckBox = document.getElementById("show-evolution").checked;    //stores state of checkbox that specifies whether to show evolutionary line of named pokemon
    const varietiesCheckBox = document.getElementById("show-varieties").checked;
    let search = new PokeSearch(input, searchCategory, evolutionCheckBox, varietiesCheckBox);         //creates new search object that takes input value, dropdown value, and checkbox states as arguments
    search.execute();
}

class PokeSearch {
    constructor(searchInput, category, evolutionCheckBox, varietiesCheckBox) {
        this.searchInput = searchInput;
        this.category = category;
        this.evolutionCheckBox = evolutionCheckBox;
        this.varietiesCheckBox = varietiesCheckBox;
        this.pokemonList = document.getElementById("pokemon-list");
    }

    //the method that's called when the button is pressed
    execute() {
        this.clearList(this.pokemonList);   //clears the pokemon-list div if there was a previous search

        //if name is selected from drop down, runs searchName() function or initializes evolution chain if the evolution check box is checked
        if (this.category == "name") {
            if (this.evolutionCheckBox) {
                return this.initEvolutionChain();
            } else {
                return this.searchName();
            }
            //returns searchType() function of type category is selected from dropown
        } else if (this.category == "type") {
            return this.searchType();

        }
    }

    //called from execute when only a pokemon name is searched and writes the pokemon name to the url 
    searchName() {
        const name_url = `https://pokeapi.co/api/v2/pokemon-species/${this.searchInput}`;
        this.fetchSpecies(name_url);
    }

    async fetchAPokemon(url) {   //takes url of individual pokemon and creates a container
        try {
            const response = await fetch(url);
            if (!response.ok || this.searchInput == "") {
                throw new Error("Not Found");
            } else {
                const pokeData = await response.json();

                //creates card container and adds "card" as class
                const pokemonContainer = document.createElement('div');
                pokemonContainer.classList.add("card");

                //load sprite image url, creates image element, assigns id and class and assigns url to element
                const sprite = pokeData.sprites.front_default;
                const img = document.createElement('img');
                img.id = "sprite";
                img.classList.add("sprite");
                const spriteContainer = document.createElement('div');
                spriteContainer.classList.add("sprite-container");
                //only sets image src if it exists
                if (sprite != null) { 
                    img.src = sprite;
                    spriteContainer.append(img);
                }
                pokemonContainer.append(spriteContainer);


                //creates h2 elment, gets pokemon name, assigns name to element and appends to container
                const textContainer = document.createElement('div');
                textContainer.classList.add("text-container");
                const name = document.createElement('h2');
                name.innerHTML = pokeData.name.toLowerCase();
                textContainer.append(name);
                pokemonContainer.appendChild(textContainer);

                //gets pokemon type name(s), changes string to match image file name and assigns file path to image element
                const typeContainer = document.createElement('div');
                typeContainer.classList.add("type-container");
                // const type=document.createElement('h3');
                // type.innerHTML="Type:";
                // typeContainer.append(type);
                for (let j = 0; j < pokeData.types.length; j++) {
                    const str = pokeData.types[j].type.name;
                    let result = str.charAt(0).toUpperCase() + str.slice(1);
                    const typeImg = document.createElement('img');
                    typeImg.id = `type-${j}`;
                    typeImg.classList.add("type-img");
                    typeImg.src = `Assets/Types/Type_${result}.webp`;
                    typeContainer.append(typeImg);
                }
                pokemonContainer.appendChild(typeContainer);
                this.pokemonList.appendChild(pokemonContainer);
            }
        }
        catch (error) {
            this.errorNotFound(error);
        }
    }

    searchType() {
        const type_url = `https://pokeapi.co/api/v2/type/${this.searchInput}`
        this.fetchType(type_url);
    }

    async fetchType(url) {
        try {
            const response = await fetch(url);
            if (!response.ok || this.searchInput == "") {
                throw new Error("Not Found");
            } else {
                const data = await response.json();
                const pokeInType = data.pokemon;
                for (let i = 0; i < pokeInType.length; i++) {
                    this.fetchAPokemon(pokeInType[i].pokemon.url);
                }
            }
        }
        catch (error) {
            this.errorNotFound(error);
        }
    }

    //if "show evolutionary line" is checked, the species url is fetched using the name of the pokemon in order to get the evolution chain url
    async initEvolutionChain() {
        const species_url = `https://pokeapi.co/api/v2/pokemon-species/${this.searchInput}`
        try {
            const response = await fetch(species_url);
            if (!response.ok || this.searchInput == "") {
                throw new Error("Not Found");
            } else {
                const data = await response.json();
                const ev_chain_url = data.evolution_chain.url;
                this.fetchEvolutionChain(ev_chain_url);
                //const species_name_url=data.varieties[0].pokemon.url;
            }
        }
        catch (error) {
            this.errorNotFound(error);
        }
    }

    async fetchEvolutionChain(url) {
        try {
            const response = await fetch(url);
            if (!response.ok || this.searchInput == "") {
                throw new Error("Not Found");
            } else {
                const data = await response.json();

                //gets the first species name and calls fetchAPokemon with the url of that name
                //var name = data.chain.species.name;
                //this.fetchAPokemon(`https://pokeapi.co/api/v2/pokemon/${name}`);
                var species_url = data.chain.species.url;
                this.fetchSpecies(species_url);

                //the rest of the chain is stored under the key "evolves to"
                const ev_chain = data.chain.evolves_to;
                this.checkBranch(ev_chain);
            }
        }
        catch (error) {
            this.errorNotFound(error);
        }
    }

    //recursive function that checks all branches of the evolution chain and calls fetchAPokemon for each
    checkBranch(ev_chain) {
        for (let i = 0; i < ev_chain.length; i++) {
            // var name = ev_chain[i].species.name;
            // this.fetchAPokemon(`https://pokeapi.co/api/v2/pokemon/${name}`);
            var species_url = ev_chain[i].species.url;
            this.fetchSpecies(species_url);
            const branch = ev_chain[i].evolves_to;
            this.checkBranch(branch);
        }
    }

    //makes a call to the pokemon-species page for the pokomon and calls fetchAPokemon for the first (default) variety, or loops through all varieties when show all varieties is checked
    async fetchSpecies(species_url) {
        try {
            const response = await fetch(species_url);
            if (!response.ok || this.searchInput == "") {
                throw new Error("Not Found");
            } else {
                const data = await response.json();
                if (this.varietiesCheckBox) {
                    for (let i = 0; i < data.varieties.length; i++) {
                        const name_url = data.varieties[i].pokemon.url;
                        //console.log(name_url);
                        this.fetchAPokemon(name_url);
                    }
                } else {
                    const name_url = data.varieties[0].pokemon.url;
                    this.fetchAPokemon(name_url);
                }
            }
        }
        catch (error) {
            this.errorNotFound(error);
        }
    }

    //function to plug into aync call catch
    errorNotFound(error) {
        console.log(error);
        var err = document.createElement('h2');
        err.innerHTML = 'Not Found';
        this.pokemonList.appendChild(err);
    }

    //clears out list container of old pokemon cards when a new search is executed
    clearList(parentList) {
        if (parentList.hasChildNodes()) {
            var listLength = parentList.children.length;
            for (var i = 0; i < listLength; i++) {
                parentList.removeChild(parentList.childNodes[0]);
            }
        }
    }
}