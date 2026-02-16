window.RevealCodefolder = function () {
  return {
    id: "RevealCodefolder",
    init: function (deck) {
      initCodeFolding();
      initCodeInlineFolding();
    },
  };
};

