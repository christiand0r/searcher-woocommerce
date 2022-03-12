const URL = "https://xxxxx-yyyyy-zzzzz/wp-json/wc/v3/";
const CK = "ck_****************************************";
const CS = "cs_****************************************";

const loaderHTML = `
  <div class="lds-ellipsis">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
`;

//Esperar carga del DOM
document.addEventListener("DOMContentLoaded", () => {
  initialStateForm();
});

async function initialStateForm() {
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

  //Insertamos todas las marcas
  insertOptions($form["searcher_brand"], brands);

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
      "https://xxxxx-yyyyy-zzzzz/wp-content/uploads/year/month/npia.png";

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
