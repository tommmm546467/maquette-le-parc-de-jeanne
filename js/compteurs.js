/* ============================================================
   LE PARC DE JEANNE — Compteurs de la bande des points forts
   Les nombres de la bande (4 gîtes, 4 à 9, 9 h – 19 h) défilent de 0 à
   leur valeur la première fois que la bande entre à l'écran, une fois
   le rideau de chargement parti. Les éléments de la bande montent
   aussi en fondu, l'un après l'autre.

   Le HTML porte les valeurs finales : sans JavaScript, ou avec la
   préférence « animations réduites », rien ne bouge et tout est lisible.
   Les lecteurs d'écran lisent la valeur finale, jamais les étapes.
   ============================================================ */
(function (window, document) {
  'use strict';
  var TN = window.TN = window.TN || {};

  var DUREE = 1600;   // durée du décompte, en ms
  var PAS = 110;      // décalage entre deux éléments de la bande

  var bande = document.querySelector('.reperes');
  if (!bande) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var items = Array.prototype.slice.call(bande.querySelectorAll('.repere'));
  var compteurs = [];

  /* Chaque nombre du texte devient un <span> animé, masqué aux lecteurs
     d'écran ; la valeur finale est ajoutée à part, en texte lisible. */
  items.forEach(function (item) {
    var chiffre = item.querySelector('.repere__chiffre');
    if (!chiffre || !/\d/.test(chiffre.textContent)) return;
    var final = chiffre.textContent;
    var visuel = document.createElement('span');
    visuel.setAttribute('aria-hidden', 'true');
    visuel.innerHTML = final.replace(/\d+/g, function (n) {
      return '<span class="compteur" data-cible="' + n + '">' + n + '</span>';
    });
    var lu = document.createElement('span');
    lu.className = 'lecture-seule';
    lu.textContent = final;
    chiffre.textContent = '';
    chiffre.appendChild(visuel);
    chiffre.appendChild(lu);
    Array.prototype.forEach.call(visuel.querySelectorAll('.compteur'), function (c) {
      compteurs.push(c);
    });
  });

  /* Largeur figée à celle de la valeur finale : le texte autour ne
     tressaute pas pendant que « 0 » devient « 580 ». */
  compteurs.forEach(function (c) {
    c.style.minWidth = c.getBoundingClientRect().width + 'px';
    c.textContent = '0';
  });
  items.forEach(function (item, i) {
    item.classList.add('repere--attente');
    item.style.setProperty('--delai-point', ((i % 4) * PAS) + 'ms');
  });

  function adoucir(t) { return 1 - Math.pow(1 - t, 3); }

  function lancer() {
    items.forEach(function (item) {
      item.classList.remove('repere--attente');
      item.classList.add('repere--entre');
    });
    var debut = null;
    function image(maintenant) {
      if (debut === null) debut = maintenant;
      var t = Math.min(1, (maintenant - debut) / DUREE);
      var k = adoucir(t);
      compteurs.forEach(function (c) {
        c.textContent = String(Math.round(k * parseInt(c.getAttribute('data-cible'), 10)));
      });
      if (t < 1) window.requestAnimationFrame(image);
    }
    window.requestAnimationFrame(image);
    // Filet : un onglet en arrière-plan suspend requestAnimationFrame. Quoi
    // qu'il arrive, la valeur finale est en place à la fin du décompte.
    window.setTimeout(function () {
      compteurs.forEach(function (c) { c.textContent = c.getAttribute('data-cible'); });
    }, DUREE + 150);
  }

  /* Deux conditions : le rideau est parti, et la bande est visible. */
  var rideauParti = !!TN.rideauParti || !document.getElementById('loader');
  var visible = false;
  var fait = false;
  function peutEtreLancer() {
    if (fait || !rideauParti || !visible) return;
    fait = true;
    lancer();
  }

  document.addEventListener('tn:rideau-parti', function () {
    rideauParti = true;
    peutEtreLancer();
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entrees) {
      if (!entrees[0].isIntersecting) return;
      visible = true;
      obs.disconnect();
      peutEtreLancer();
    }, { threshold: 0.35 });
    obs.observe(bande);
  } else {
    visible = true;
    peutEtreLancer();
  }
})(window, document);
