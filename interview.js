function promisefunction() {
  for (let i = 10; i > 0; i--) {
    setTimeout(() => {
      console.log(i);
    }, 1000 * (10 - i));
  }
}
promisefunction();
