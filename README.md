# json-overview

Simple frontent application which parses JSON data and provides search for that.

Initial data was generated with:

```JS
const data = new Array(10).fill().map(_ => {
  return {
    name: RandomWord(),
    value: parseInt(Math.floor(Math.random() * 10))
  };
});
```
