const URL = "https://keylessworldusa.com/wp-json/wc/v3/";
const CK = "ck_675835568c408d902604d25d05b940f8ad0ea136";
const CS = "cs_687836aeaa166718f6a61319f59843c704569e5b";

const loaderHTML = `
  <div class="lds-ellipsis">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
`;

const filterBrand = (brand) => {
  const brandNone = [
    "American Motors Corporation",
    "Blades",
    "Flip Shells",
    "Key Shells",
    "Keydiy",
    "Keyless Remotes",
    "Lishi Tools",
    "Lock Ingnitions",
    "Locksmith Tools",
    "Remote Head Key",
    "Rubber Pad",
    "Smart Key",
    "Strattec",
    "Transponder Chip",
    "Transponder Keys",
    "Uncategorized",
    "Unlocking Service",
    "Xhorse",
    "Remote Head and Flip Key",
  ];

  return brandNone.includes(brand);
};

//Esperar carga del DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("Ready");
  initialStateForm();
});

async function initialStateForm() {
  console.log("Start");

  //Carga Inicial del Formulario
  const $form = document.getElementById("form_searcher");
  const $button = document.querySelector("#form_searcher button[type=submit]");

  //Obtenemos todas las marcas
  const brands = await getDataWoocommerce(URL, "products/categories", {
    page: 1,
    parent: 0,
    consumer_key: CK,
    consumer_secret: CS,
  });

  const filteredBrands = brands.filter((brand) => !filterBrand(brand.name));

  //Insertamos todas las marcas
  insertOptions($form["searcher_brand"], filteredBrands);

  document.addEventListener("change", async (e) => {
    if (e.target === $form["searcher_brand"]) {
      $button.innerHTML = loaderHTML;

      //Obtenemos todos los modelos de la marca
      const models = await getDataWoocommerce(URL, "products/categories", {
        page: 1,
        parent: e.target.value,
        consumer_key: CK,
        consumer_secret: CS,
      });

      $button.innerHTML = "SEARCH";

      $form["searcher_model"].disabled = false;
      insertOptions($form["searcher_model"], models);
    }

    if (e.target === $form["searcher_model"]) {
      $button.innerHTML = loaderHTML;

      //Obtenemos todos los productos del modelo
      const products = await getDataWoocommerce(URL, "products", {
        category: e.target.value,
        consumer_key: CK,
        consumer_secret: CS,
      });

      $button.innerHTML = "SEARCH";

      let tagsYears = [];
      products.map(({ tags }) => (tagsYears = [...tags, ...tagsYears]));

      //Obtenemos unicamente name y id
      //Filtramos aquello que no sean años
      //Transformamos a texto

      const years = tagsYears
        .map(({ name, id }) => {
          return { name, id };
        })
        .filter((el) => !isNaN(el.name))
        .map(({ name, id }) => `{"name": ${name}, "id": ${id}}`);

      //Usamos Set para eliminar los duplicados
      //Parseamos para obtener los objetos
      //Ordenamos de menor a mayor
      const yearsSorted = Array.from(new Set(years))
        .map((el) => JSON.parse(el))
        .sort((a, b) => a.name - b.name);

      $form["searcher_year"].disabled = false;
      insertOptions($form["searcher_year"], yearsSorted);
    }
  });

  $form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $button.innerHTML = loaderHTML;

    const res = await getDataWoocommerce(URL, "products", {
      tag: e.target["searcher_year"].value,
      category: e.target["searcher_model"].value,
      consumer_key: CK,
      consumer_secret: CS,
    });

    $button.innerHTML = "SEARCH";

    //Insertar Producto
    const $feed = document.querySelector(".feed_products");
    const $template = document.getElementById("card_product").content;
    const fragmet = new DocumentFragment();

    if (res.length === 0) {
      $feed.innerHTML = `
        <h2 class="npf">Oops.. We have not found any product</h2>
      `;
    }

    //Imagen si la imagen no está disponible
    const npia =
      "https://keylessworldusa.com/wp-content/uploads/2022/03/npia.png";

    res.forEach(({ id, images, name, permalink, price, categories }) => {
      let cloneTemplate = $template.cloneNode(true);

      cloneTemplate.querySelector(".card_product").dataset.pid = id;

      //Agregar imagen
      cloneTemplate.querySelector(".card_product-image").src =
        images[0].src || npia;
      cloneTemplate.querySelector(".card_product-image").alt =
        images[0].alt || name;

      //Agregar datos
      cloneTemplate.querySelector(".product_name").innerHTML = name;
      cloneTemplate.querySelector(".product_price").innerHTML = `$${price}`;

      //Categoria del producto
      const category = categories.filter(
        (el) => el.id === Number(e.target["searcher_brand"].value)
      );

      cloneTemplate.querySelector(".product_categories").innerHTML =
        category[0].name;

      //Agregar link
      cloneTemplate.querySelector(".card_product-buy").href = permalink;

      fragmet.append(cloneTemplate);
    });

    $feed.innerHTML = "";
    $feed.append(fragmet);
  });
}

const getDataWoocommerce = async (url, path, options) => {
  if (!url) throw new Error("Debe indicar una url válida");

  //Cantidad de resultados tras petición, por defecto 100
  options["per_page"] = options["per_page"] || 100;

  if (options["per_page"] > 100)
    throw new Error(
      "La API de Woocommerce solo permite mostrar 100 productos por petición"
    );

  //Paginación, si se indica se harán peticiones hasta que el resultado sea un array vacío ( [] )
  options.page = options.page || false;
  !options.page && delete options.page;

  //Se deben indicar las claves
  if (!options["consumer_key"] && !options["consumer_secret"])
    throw new Error(
      "Debe indicar tanto la consumer_key como la consumer_secret"
    );

  const params = Object.keys(options)
    .map((el) => `${el}=${options[el]}`)
    .join("&");

  if (options.page) {
    let totalData = [];
    let counter = options.page;

    let data = await fetch(`${url}${path}?${params}&`).then((res) =>
      res.json()
    );

    while (data.length > 0) {
      //Modificamos
      const nextPage = params.replace("page=1", `page=${counter}`);

      //Repetimos la solicitud
      data = await fetch(`${url}${path}?${nextPage}&`).then((res) =>
        res.json()
      );

      //Agregamos la respuesta al array principal
      totalData = [...totalData, ...data];

      counter++;
    }

    return totalData;
  }

  return fetch(`${url}${path}?${params}`)
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .catch((error) => console.log(error));
};

const insertOptions = (select, options) => {
  //Capturamos el placeholder
  const $placeholder = select.querySelector("option");

  //Fragmento
  const fragment = new DocumentFragment();

  options.forEach((opt) => {
    const $option = document.createElement("option");

    //Asignamos un valor
    $option.value = opt.id || opt;

    //Agregamos el contenido
    $option.innerHTML = opt.name || opt;

    //Agregamos al fragmento
    fragment.append($option);
  });

  select.innerHTML = "";
  select.append($placeholder, fragment);
};
