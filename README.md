# Buscador de Productos usando la API de Woocommerce

Utilzando tus credenciales de la API de Woocoommerce podrás consumir distintos endpoints y mostrar resultados en un feed.

## Uso
En el archivo `app.js` deberá de colocar sus credenciales y posteriormente colocar los enpoints que quiera consumir en la función getDataWoocommerce()


### getDataWoocommerce(url : string, path : string, options : object)

Está función recibe tres parámetros

- **url**: corresponde al dominio de su sitio más el path `wp-json/wc/v3/`
- **path**: corresponde al enpoint de Woocommerce que deseamos consultar
- **options**: un objeto que establece el formato de la consulta a la API de Woocommerce. Puede indicar cualquier valor existente según la documentación de [Woocommerce API](https://woocommerce.github.io/woocommerce-rest-api-docs/?javascript) para cualquier endpoint, por defecto estos son los valores que toma si no se le indican

  - `per_page`: valor de tipo *number* que indica la cantidad de datos que traerá luego de la consulta | `por defecto: 100`
  
  - `page`: valor de tipo *number*, si se indica se hará una paginación iniciado desde el número indicado hasta que la consulta retorne un array vacío como respuesta | `por defecto: false`
  
  - `consumer_key`: credencial otorgado por Woocomerce para realizar consulta a la API | `requerido`
  
  - `consumer_secret`: credencial otorgado por Woocomerce para realizar consulta a la API | `requerido`


### HTML y Javascript

En el `index.html` tiene una etiqueta **< template >** donde debe colocar el formato de presentación que se mostrará con los resultados de la busqueda y en el archivo `app.js` en el evento **submit** podrá modificar la inserción de datos. El evento asignado para escuchar/detectar los cambios es 'change'
