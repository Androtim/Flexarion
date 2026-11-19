<!-- À publier le 21/11. Type : « Tutorial » ou « Game Design ». -->

Titre : Flexarion : comment on génère une carte d'Aix toujours jouable

Corps :

Dans Veridia 2140, chaque journée commence sur une carte différente. Le piège de la génération procédurale, c'est la carte impossible : un quartier enfermé derrière des rochers, ou un réseau qui demande plus de tuyaux que vous n'en avez.

Notre générateur place la rivière de l'Arc, les vallons, les rochers et les pinèdes protégées, puis il vérifie sa propre carte :

- il cherche un réseau qui relie la source à tous les quartiers (en ajoutant à chaque fois le chemin le moins cher vers le quartier le plus proche, avec l'algorithme de Dijkstra) ;
- si ce réseau ne tient pas dans vos tuyaux, moins une petite réserve pour les urgences, la carte est jetée et on en tire une autre.

À chaque modification du code, un script teste 480 cartes et fait jouer un joueur automatique sur 30 parties. Il tient en moyenne 5 jours : à vous de faire mieux.

Le détail technique (avec le code du partage de l'eau) est sur le site de Flexarion : https://flexarion.alwaysdata.net/devlogs/pivot-viaducs-generation-procedurale/

Jouer gratuitement : https://flexarion.alwaysdata.net/jouer/
