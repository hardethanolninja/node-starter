module.exports =
  (fn) =>
  //return anonymous function, called when express is called
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
