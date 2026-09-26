// Player database. Ratings are approximate EA FC 26-style overalls (icons get
// icon-style ratings). Careers list senior clubs in order, including notable
// loans, as of the 2025/26 season. Photos come live from Wikipedia/Wikimedia.
//
// Format: Name | wiki title ("-" = same as name) | Nation | Pos | Rating | Born | Club>Club>...

const ACTIVE = `
Thibaut Courtois|-|Belgium|GK|89|1992|Genk>Chelsea>Atlético Madrid>Real Madrid
Alisson Becker|-|Brazil|GK|89|1992|Internacional>Roma>Liverpool
Gianluigi Donnarumma|-|Italy|GK|89|1999|AC Milan>PSG>Man City
Jan Oblak|-|Slovenia|GK|87|1993|Olimpija Ljubljana>Benfica>Atlético Madrid
Marc-André ter Stegen|-|Germany|GK|85|1992|Gladbach>Barcelona
Emiliano Martínez|-|Argentina|GK|86|1992|Arsenal>Aston Villa
Mike Maignan|-|France|GK|87|1995|Lille>AC Milan
Ederson|Ederson (footballer, born 1993)|Brazil|GK|85|1993|Rio Ave>Benfica>Man City>Fenerbahçe
David Raya|-|Spain|GK|87|1995|Blackburn>Brentford>Arsenal
Yann Sommer|-|Switzerland|GK|84|1988|Basel>Gladbach>Bayern>Inter
Manuel Neuer|-|Germany|GK|86|1986|Schalke>Bayern
André Onana|-|Cameroon|GK|80|1996|Ajax>Inter>Man United>Trabzonspor
Unai Simón|-|Spain|GK|85|1997|Athletic Club
Gregor Kobel|-|Switzerland|GK|87|1997|Hoffenheim>Augsburg>Stuttgart>Dortmund
Diogo Costa|-|Portugal|GK|85|1999|Porto
Jordan Pickford|-|England|GK|83|1994|Sunderland>Everton
Guglielmo Vicario|-|Italy|GK|84|1996|Cagliari>Empoli>Tottenham
Robert Sánchez|Robert Sánchez (footballer)|Spain|GK|80|1997|Brighton>Chelsea
Wojciech Szczęsny|-|Poland|GK|83|1990|Arsenal>Roma>Juventus>Barcelona
Joan García|Joan Garcia|Spain|GK|83|2001|Espanyol>Barcelona
Yassine Bounou|-|Morocco|GK|84|1991|Wydad Casablanca>Atlético Madrid>Girona>Sevilla>Al Hilal
Virgil van Dijk|-|Netherlands|CB|90|1991|Groningen>Celtic>Southampton>Liverpool
William Saliba|-|France|CB|88|2001|Saint-Étienne>Arsenal>Nice>Marseille>Arsenal
Rúben Dias|-|Portugal|CB|88|1997|Benfica>Man City
Antonio Rüdiger|-|Germany|CB|86|1993|Stuttgart>Roma>Chelsea>Real Madrid
Gabriel Magalhães|-|Brazil|CB|87|1997|Avaí>Lille>Arsenal
Marquinhos|-|Brazil|CB|86|1994|Corinthians>Roma>PSG
Alessandro Bastoni|-|Italy|CB|86|1999|Atalanta>Parma>Inter
Joško Gvardiol|-|Croatia|CB|86|2002|Dinamo Zagreb>RB Leipzig>Man City
Kim Min-jae|Kim Min-jae (footballer, born 1996)|South Korea|CB|84|1996|Jeonbuk Hyundai Motors>Beijing Guoan>Fenerbahçe>Napoli>Bayern
Dayot Upamecano|-|France|CB|85|1998|Salzburg>RB Leipzig>Bayern
Ronald Araújo|-|Uruguay|CB|83|1999|Boston River>Barcelona
Pau Cubarsí|-|Spain|CB|84|2007|Barcelona
Willian Pacho|-|Ecuador|CB|85|2001|Independiente del Valle>Antwerp>Eintracht Frankfurt>PSG
Micky van de Ven|-|Netherlands|CB|84|2001|Volendam>Wolfsburg>Tottenham
Cristian Romero|-|Argentina|CB|85|1998|Belgrano>Genoa>Atalanta>Tottenham
Éder Militão|-|Brazil|CB|84|1998|São Paulo>Porto>Real Madrid
John Stones|-|England|CB|83|1994|Barnsley>Everton>Man City
Dean Huijsen|-|Spain|CB|82|2005|Juventus>Roma>Bournemouth>Real Madrid
Jonathan Tah|-|Germany|CB|85|1996|Hamburg>Fortuna Düsseldorf>Leverkusen>Bayern
Nico Schlotterbeck|-|Germany|CB|84|1999|Freiburg>Union Berlin>Freiburg>Dortmund
Matthijs de Ligt|-|Netherlands|CB|82|1999|Ajax>Juventus>Bayern>Man United
Lisandro Martínez|-|Argentina|CB|82|1998|Newell's Old Boys>Defensa y Justicia>Ajax>Man United
Harry Maguire|-|England|CB|78|1993|Sheffield United>Hull City>Leicester>Man United
Aymeric Laporte|-|Spain|CB|81|1994|Athletic Club>Man City>Al Nassr>Athletic Club
Kalidou Koulibaly|-|Senegal|CB|80|1991|Metz>Genk>Napoli>Chelsea>Al Hilal
Marc Guéhi|-|England|CB|84|2000|Chelsea>Swansea>Crystal Palace
Levi Colwill|-|England|CB|81|2003|Chelsea>Huddersfield>Brighton>Chelsea
Ibrahima Konaté|-|France|CB|85|1999|Sochaux>RB Leipzig>Liverpool
Leny Yoro|-|France|CB|78|2005|Lille>Man United
Nathan Aké|-|Netherlands|CB|80|1995|Chelsea>Watford>Bournemouth>Man City
Jules Koundé|-|France|RB|85|1998|Bordeaux>Sevilla>Barcelona
Achraf Hakimi|-|Morocco|RB|89|1998|Real Madrid>Dortmund>Inter>PSG
Trent Alexander-Arnold|-|England|RB|86|1998|Liverpool>Real Madrid
Jeremie Frimpong|-|Netherlands|RB|83|2000|Celtic>Leverkusen>Liverpool
Kyle Walker|-|England|RB|79|1990|Sheffield United>Tottenham>Man City>AC Milan>Burnley
Reece James|-|England|RB|84|1999|Wigan>Chelsea
Dani Carvajal|-|Spain|RB|84|1992|Leverkusen>Real Madrid
Pedro Porro|-|Spain|RB|83|1999|Girona>Real Valladolid>Sporting CP>Tottenham
Diogo Dalot|-|Portugal|RB|80|1999|Porto>Man United>AC Milan>Man United
Giovanni Di Lorenzo|-|Italy|RB|83|1993|Empoli>Napoli
Kieran Trippier|-|England|RB|79|1990|Burnley>Tottenham>Atlético Madrid>Newcastle
Denzel Dumfries|-|Netherlands|RB|84|1996|Sparta Rotterdam>Heerenveen>PSV>Inter
Malo Gusto|-|France|RB|80|2003|Lyon>Chelsea
João Cancelo|-|Portugal|RB|82|1994|Benfica>Valencia>Inter>Juventus>Man City>Bayern>Barcelona>Al Hilal
Jurriën Timber|-|Netherlands|RB|83|2001|Ajax>Arsenal
Ben White|Ben White (footballer)|England|RB|81|1997|Brighton>Leeds>Arsenal
Alphonso Davies|-|Canada|LB|84|2000|Vancouver Whitecaps>Bayern
Theo Hernández|-|France|LB|85|1997|Alavés>Real Madrid>Real Sociedad>AC Milan>Al Hilal
Nuno Mendes|Nuno Mendes (footballer, born 2002)|Portugal|LB|88|2002|Sporting CP>PSG
Alejandro Grimaldo|-|Spain|LB|85|1995|Benfica>Leverkusen
Andy Robertson|-|Scotland|LB|83|1994|Queen's Park>Dundee United>Hull City>Liverpool
Alejandro Balde|-|Spain|LB|83|2003|Barcelona
Ferland Mendy|-|France|LB|82|1995|Le Havre>Lyon>Real Madrid
Federico Dimarco|-|Italy|LB|85|1997|Inter>Sion>Parma>Verona>Inter
Milos Kerkez|-|Hungary|LB|81|2003|AZ>Bournemouth>Liverpool
Álvaro Carreras|-|Spain|LB|81|2003|Granada>Benfica>Real Madrid
Luke Shaw|-|England|LB|78|1995|Southampton>Man United
Destiny Udogie|-|Italy|LB|80|2002|Verona>Udinese>Tottenham
Rayan Aït-Nouri|-|Algeria|LB|82|2001|Angers>Wolves>Man City
Marc Cucurella|-|Spain|LB|84|1998|Eibar>Getafe>Brighton>Chelsea
Riccardo Calafiori|-|Italy|LB|82|2002|Roma>Basel>Bologna>Arsenal
Rodri|Rodri (footballer, born 1996)|Spain|CDM|89|1996|Villarreal>Atlético Madrid>Man City
Declan Rice|-|England|CDM|87|1999|West Ham>Arsenal
Joshua Kimmich|-|Germany|CDM|89|1995|RB Leipzig>Bayern
Aurélien Tchouaméni|-|France|CDM|85|2000|Bordeaux>Monaco>Real Madrid
Casemiro|-|Brazil|CDM|81|1992|São Paulo>Real Madrid>Porto>Real Madrid>Man United
Moisés Caicedo|-|Ecuador|CDM|87|2001|Independiente del Valle>Brighton>Chelsea
Ryan Gravenberch|-|Netherlands|CDM|85|2002|Ajax>Bayern>Liverpool
Granit Xhaka|-|Switzerland|CDM|84|1992|Basel>Gladbach>Arsenal>Leverkusen>Sunderland
Hakan Çalhanoğlu|-|Turkey|CDM|85|1994|Karlsruher SC>Hamburg>Leverkusen>AC Milan>Inter
Martín Zubimendi|-|Spain|CDM|86|1999|Real Sociedad>Arsenal
Sandro Tonali|-|Italy|CDM|84|2000|Brescia>AC Milan>Newcastle
N'Golo Kanté|-|France|CDM|81|1991|Boulogne>Caen>Leicester>Chelsea>Al Ittihad
Marcelo Brozović|-|Croatia|CDM|80|1992|Dinamo Zagreb>Inter>Al Nassr
Pedri|-|Spain|CM|90|2002|Las Palmas>Barcelona
Gavi|Gavi (footballer)|Spain|CM|82|2004|Barcelona
Frenkie de Jong|-|Netherlands|CM|86|1997|Willem II>Ajax>Barcelona
Federico Valverde|-|Uruguay|CM|88|1998|Peñarol>Deportivo La Coruña>Real Madrid
Eduardo Camavinga|-|France|CM|83|2002|Rennes>Real Madrid
Luka Modrić|-|Croatia|CM|84|1985|Dinamo Zagreb>Tottenham>Real Madrid>AC Milan
Vitinha|Vitinha (footballer, born February 2000)|Portugal|CM|89|2000|Porto>Wolves>Porto>PSG
João Neves|João Neves (footballer)|Portugal|CM|86|2004|Benfica>PSG
Warren Zaïre-Emery|-|France|CM|80|2006|PSG
Fabián Ruiz|-|Spain|CM|84|1996|Real Betis>Napoli>PSG
Kobbie Mainoo|-|England|CM|78|2005|Man United
Enzo Fernández|-|Argentina|CM|85|2001|River Plate>Defensa y Justicia>Benfica>Chelsea
Alexis Mac Allister|-|Argentina|CM|87|1998|Argentinos Juniors>Brighton>Boca Juniors>Liverpool
Dominik Szoboszlai|-|Hungary|CM|84|2000|Salzburg>RB Leipzig>Liverpool
Leon Goretzka|-|Germany|CM|82|1995|Bochum>Schalke>Bayern
Nicolò Barella|-|Italy|CM|86|1997|Cagliari>Inter
Scott McTominay|-|Scotland|CM|86|1996|Man United>Napoli
Bernardo Silva|-|Portugal|CM|86|1994|Benfica>Monaco>Man City
İlkay Gündoğan|-|Germany|CM|83|1990|Nürnberg>Dortmund>Man City>Barcelona>Galatasaray
Mateo Kovačić|-|Croatia|CM|83|1994|Dinamo Zagreb>Inter>Real Madrid>Chelsea>Man City
Mikel Merino|-|Spain|CM|83|1996|Osasuna>Dortmund>Newcastle>Real Sociedad>Arsenal
Bruno Guimarães|-|Brazil|CM|86|1997|Athletico Paranaense>Lyon>Newcastle
Youri Tielemans|-|Belgium|CM|81|1997|Anderlecht>Monaco>Leicester>Aston Villa
Tijjani Reijnders|-|Netherlands|CM|84|1998|AZ>AC Milan>Man City
Christian Eriksen|-|Denmark|CM|78|1992|Ajax>Tottenham>Inter>Brentford>Man United>Wolfsburg
Paul Pogba|-|France|CM|77|1993|Man United>Juventus>Man United>Juventus>Monaco
Rodrigo De Paul|-|Argentina|CM|82|1994|Racing Club>Valencia>Udinese>Atlético Madrid>Inter Miami
Koke|Koke (footballer, born 1992)|Spain|CM|81|1992|Atlético Madrid
Teun Koopmeiners|-|Netherlands|CM|81|1998|AZ>Atalanta>Juventus
Weston McKennie|-|USA|CM|79|1998|Schalke>Juventus>Leeds>Juventus
Conor Gallagher|-|England|CM|81|2000|Charlton>Swansea>West Brom>Crystal Palace>Chelsea>Atlético Madrid
Jude Bellingham|-|England|CAM|89|2003|Birmingham>Dortmund>Real Madrid
Martin Ødegaard|-|Norway|CAM|87|1998|Strømsgodset>Real Madrid>Heerenveen>Vitesse>Real Sociedad>Arsenal
Kevin De Bruyne|-|Belgium|CAM|87|1991|Genk>Chelsea>Werder Bremen>Wolfsburg>Man City>Napoli
Bruno Fernandes|-|Portugal|CAM|87|1994|Novara>Udinese>Sampdoria>Sporting CP>Man United
Cole Palmer|-|England|CAM|87|2002|Man City>Chelsea
Florian Wirtz|-|Germany|CAM|88|2003|Leverkusen>Liverpool
Jamal Musiala|-|Germany|CAM|88|2003|Bayern
Phil Foden|-|England|CAM|85|2000|Man City
James Maddison|-|England|CAM|81|1996|Coventry>Norwich>Aberdeen>Norwich>Leicester>Tottenham
Morgan Rogers|-|England|CAM|82|2002|West Brom>Middlesbrough>Aston Villa
Eberechi Eze|-|England|CAM|84|1998|QPR>Crystal Palace>Arsenal
Xavi Simons|-|Netherlands|CAM|83|2003|PSG>PSV>RB Leipzig>Tottenham
Dani Olmo|-|Spain|CAM|84|1998|Dinamo Zagreb>RB Leipzig>Barcelona
Rayan Cherki|-|France|CAM|81|2003|Lyon>Man City
Arda Güler|-|Turkey|CAM|83|2005|Fenerbahçe>Real Madrid
Mason Mount|-|England|CAM|78|1999|Vitesse>Derby County>Chelsea>Man United
Paulo Dybala|-|Argentina|CAM|81|1993|Instituto>Palermo>Juventus>Roma
Vinícius Júnior|-|Brazil|LW|89|2000|Flamengo>Real Madrid
Raphinha|-|Brazil|LW|89|1996|Vitória Guimarães>Sporting CP>Rennes>Leeds>Barcelona
Khvicha Kvaratskhelia|-|Georgia|LW|87|2001|Dinamo Tbilisi>Lokomotiv Moscow>Rubin Kazan>Dinamo Batumi>Napoli>PSG
Bradley Barcola|-|France|LW|84|2002|Lyon>PSG
Son Heung-min|-|South Korea|LW|84|1992|Hamburg>Leverkusen>Tottenham>LAFC
Luis Díaz|Luis Díaz (footballer, born 1997)|Colombia|LW|87|1997|Junior>Porto>Liverpool>Bayern
Kingsley Coman|-|France|LW|82|1996|PSG>Juventus>Bayern>Al Nassr
Nico Williams|-|Spain|LW|85|2002|Athletic Club
Rafael Leão|-|Portugal|LW|85|1999|Sporting CP>Lille>AC Milan
Marcus Rashford|-|England|LW|80|1997|Man United>Aston Villa>Barcelona
Alejandro Garnacho|-|Argentina|LW|79|2004|Man United>Chelsea
Jack Grealish|-|England|LW|79|1995|Aston Villa>Man City>Everton
Raheem Sterling|-|England|LW|77|1994|Liverpool>Man City>Chelsea>Arsenal
Gabriel Martinelli|-|Brazil|LW|83|2001|Ituano>Arsenal
Leandro Trossard|-|Belgium|LW|82|1994|Genk>Brighton>Arsenal
Anthony Gordon|Anthony Gordon (footballer)|England|LW|82|2001|Everton>Newcastle
Ademola Lookman|-|Nigeria|LW|85|1997|Charlton>Everton>RB Leipzig>Fulham>Leicester>Atalanta
Jérémy Doku|-|Belgium|LW|83|2002|Anderlecht>Rennes>Man City
Kaoru Mitoma|-|Japan|LW|80|1997|Kawasaki Frontale>Union SG>Brighton
Cody Gakpo|-|Netherlands|LW|83|1999|PSV>Liverpool
Kenan Yıldız|-|Turkey|LW|83|2005|Juventus
Neymar|-|Brazil|LW|80|1992|Santos>Barcelona>PSG>Al Hilal>Santos
Lamine Yamal|-|Spain|RW|89|2007|Barcelona
Mohamed Salah|-|Egypt|RW|91|1992|Al Mokawloon>Basel>Chelsea>Fiorentina>Roma>Liverpool
Bukayo Saka|-|England|RW|88|2001|Arsenal
Ousmane Dembélé|-|France|RW|90|1997|Rennes>Dortmund>Barcelona>PSG
Désiré Doué|-|France|RW|85|2005|Rennes>PSG
Rodrygo|-|Brazil|RW|85|2001|Santos>Real Madrid
Michael Olise|-|France|RW|87|2001|Reading>Crystal Palace>Bayern
Leroy Sané|-|Germany|RW|82|1996|Schalke>Man City>Bayern>Galatasaray
Serge Gnabry|-|Germany|RW|81|1995|Arsenal>West Brom>Werder Bremen>Hoffenheim>Bayern
Christian Pulisic|-|USA|RW|84|1998|Dortmund>Chelsea>AC Milan
Jadon Sancho|-|England|RW|77|2000|Dortmund>Man United>Chelsea>Aston Villa
Riyad Mahrez|-|Algeria|RW|81|1991|Le Havre>Leicester>Man City>Al Ahli
Noni Madueke|-|England|RW|79|2002|PSV>Chelsea>Arsenal
Jarrod Bowen|-|England|RW|82|1996|Hull City>West Ham
Mohammed Kudus|-|Ghana|RW|82|2000|Nordsjælland>Ajax>West Ham>Tottenham
Bryan Mbeumo|-|Cameroon|RW|83|1999|Troyes>Brentford>Man United
Pedro Neto|-|Portugal|RW|82|2000|Braga>Lazio>Wolves>Chelsea
Federico Chiesa|-|Italy|RW|76|1997|Fiorentina>Juventus>Liverpool
Savinho|Sávio (footballer, born 2004)|Brazil|RW|80|2004|Atlético Mineiro>PSV>Girona>Man City
Estêvão|Estêvão Willian|Brazil|RW|79|2007|Palmeiras>Chelsea
Takefusa Kubo|-|Japan|RW|81|2001|FC Tokyo>Mallorca>Villarreal>Getafe>Real Sociedad
Dejan Kulusevski|-|Sweden|RW|83|2000|Atalanta>Parma>Juventus>Tottenham
Kylian Mbappé|-|France|ST|91|1998|Monaco>PSG>Real Madrid
Erling Haaland|-|Norway|ST|90|2000|Bryne>Molde>Salzburg>Dortmund>Man City
Harry Kane|-|England|ST|89|1993|Leyton Orient>Tottenham>Millwall>Norwich>Leicester>Tottenham>Bayern
Robert Lewandowski|-|Poland|ST|86|1988|Znicz Pruszków>Lech Poznań>Dortmund>Bayern>Barcelona
Lautaro Martínez|-|Argentina|ST|88|1997|Racing Club>Inter
Julián Álvarez|-|Argentina|ST|87|2000|River Plate>Man City>Atlético Madrid
Victor Osimhen|-|Nigeria|ST|87|1998|Wolfsburg>Charleroi>Lille>Napoli>Galatasaray
Alexander Isak|-|Sweden|ST|87|1999|AIK>Dortmund>Willem II>Real Sociedad>Newcastle>Liverpool
Viktor Gyökeres|-|Sweden|ST|86|1998|Brommapojkarna>Brighton>St. Pauli>Swansea>Coventry>Sporting CP>Arsenal
Hugo Ekitike|-|France|ST|83|2002|Reims>PSG>Eintracht Frankfurt>Liverpool
Darwin Núñez|-|Uruguay|ST|81|1999|Peñarol>Almería>Benfica>Liverpool>Al Hilal
Ollie Watkins|-|England|ST|83|1995|Exeter>Brentford>Aston Villa
Dušan Vlahović|-|Serbia|ST|82|2000|Partizan>Fiorentina>Juventus
Romelu Lukaku|-|Belgium|ST|82|1993|Anderlecht>Chelsea>West Brom>Everton>Man United>Inter>Chelsea>Roma>Napoli
Marcus Thuram|-|France|ST|85|1997|Sochaux>Guingamp>Gladbach>Inter
Benjamin Šeško|-|Slovenia|ST|80|2003|Salzburg>RB Leipzig>Man United
Rasmus Højlund|-|Denmark|ST|78|2003|Copenhagen>Sturm Graz>Atalanta>Man United>Napoli
Ivan Toney|-|England|ST|80|1996|Northampton>Newcastle>Peterborough>Brentford>Al Ahli
Dominic Solanke|-|England|ST|80|1997|Chelsea>Vitesse>Liverpool>Bournemouth>Tottenham
Nicolas Jackson|-|Senegal|ST|79|2001|Villarreal>Chelsea>Bayern
João Pedro|João Pedro (footballer, born 2001)|Brazil|ST|81|2001|Fluminense>Watford>Brighton>Chelsea
Serhou Guirassy|-|Guinea|ST|84|1996|Laval>Lille>Köln>Amiens>Rennes>Stuttgart>Dortmund
Jonathan David|-|Canada|ST|83|2000|Gent>Lille>Juventus
Cristiano Ronaldo|-|Portugal|ST|85|1985|Sporting CP>Man United>Real Madrid>Juventus>Man United>Al Nassr
Lionel Messi|-|Argentina|RW|86|1987|Barcelona>PSG>Inter Miami
Karim Benzema|-|France|ST|83|1987|Lyon>Real Madrid>Al Ittihad
Randal Kolo Muani|-|France|ST|80|1998|Nantes>Eintracht Frankfurt>PSG>Juventus>Tottenham
Gonçalo Ramos|-|Portugal|ST|80|2001|Benfica>PSG
Álvaro Morata|-|Spain|ST|78|1992|Real Madrid>Juventus>Real Madrid>Chelsea>Atlético Madrid>AC Milan>Galatasaray>Como
Ferran Torres|-|Spain|ST|81|2000|Valencia>Man City>Barcelona
Mikel Oyarzabal|-|Spain|ST|83|1997|Real Sociedad
Kai Havertz|-|Germany|ST|83|1999|Leverkusen>Chelsea>Arsenal
Gabriel Jesus|-|Brazil|ST|78|1997|Palmeiras>Man City>Arsenal
Jean-Philippe Mateta|-|France|ST|81|1997|Lyon>Mainz>Crystal Palace
Richarlison|-|Brazil|ST|78|1997|América Mineiro>Fluminense>Watford>Everton>Tottenham
Patrik Schick|-|Czech Republic|ST|83|1996|Sparta Prague>Sampdoria>Roma>RB Leipzig>Leverkusen
Moise Kean|-|Italy|ST|82|2000|Juventus>Everton>PSG>Juventus>Fiorentina
Antoine Griezmann|-|France|ST|83|1991|Real Sociedad>Atlético Madrid>Barcelona>Atlético Madrid
Jamie Vardy|-|England|ST|75|1987|Fleetwood Town>Leicester>Cremonese
`;

const ICONS = `
Iker Casillas|-|Spain|GK|91|1981|Real Madrid>Porto
Gianluigi Buffon|-|Italy|GK|92|1978|Parma>Juventus>PSG>Parma
Petr Čech|-|Czech Republic|GK|89|1982|Chmel Blšany>Sparta Prague>Rennes>Chelsea>Arsenal
Peter Schmeichel|-|Denmark|GK|90|1963|Hvidovre>Brøndby>Man United>Sporting CP>Aston Villa>Man City
Edwin van der Sar|-|Netherlands|GK|89|1970|Ajax>Juventus>Fulham>Man United
Oliver Kahn|-|Germany|GK|90|1969|Karlsruher SC>Bayern
Paolo Maldini|-|Italy|CB|94|1968|AC Milan
Franz Beckenbauer|-|Germany|CB|95|1945|Bayern>New York Cosmos>Hamburg
Carles Puyol|-|Spain|CB|90|1978|Barcelona
Sergio Ramos|-|Spain|CB|91|1986|Sevilla>Real Madrid>PSG>Sevilla>Monterrey
Rio Ferdinand|-|England|CB|89|1978|West Ham>Leeds>Man United>QPR
John Terry|-|England|CB|89|1980|Chelsea>Nottingham Forest>Chelsea>Aston Villa
Fabio Cannavaro|-|Italy|CB|91|1973|Napoli>Parma>Inter>Juventus>Real Madrid>Al-Ahli Dubai
Alessandro Nesta|-|Italy|CB|90|1976|Lazio>AC Milan>Montreal Impact
Nemanja Vidić|-|Serbia|CB|88|1981|Red Star Belgrade>Spartak Moscow>Man United>Inter
Bobby Moore|-|England|CB|90|1941|West Ham>Fulham
Cafu|-|Brazil|RB|91|1970|São Paulo>Zaragoza>Palmeiras>Roma>AC Milan
Philipp Lahm|-|Germany|RB|90|1983|Bayern>Stuttgart>Bayern
Roberto Carlos|-|Brazil|LB|91|1973|Palmeiras>Inter>Real Madrid>Fenerbahçe>Corinthians
Ashley Cole|-|England|LB|88|1980|Arsenal>Crystal Palace>Arsenal>Chelsea>Roma>LA Galaxy>Derby County
Marcelo|Marcelo (footballer, born 1988)|Brazil|LB|89|1988|Fluminense>Real Madrid>Olympiacos>Fluminense
Patrick Vieira|-|France|CDM|90|1976|Cannes>AC Milan>Arsenal>Juventus>Inter>Man City
Claude Makélélé|-|France|CDM|88|1973|Nantes>Marseille>Celta Vigo>Real Madrid>Chelsea>PSG
Roy Keane|-|Ireland|CDM|89|1971|Cobh Ramblers>Nottingham Forest>Man United>Celtic
Yaya Touré|-|Ivory Coast|CDM|89|1983|Beveren>Metalurh Donetsk>Olympiacos>Monaco>Barcelona>Man City
Xavi|Xavi (footballer, born 1980)|Spain|CM|92|1980|Barcelona>Al Sadd
Andrés Iniesta|-|Spain|CM|92|1984|Barcelona>Vissel Kobe>Emirates Club
Steven Gerrard|-|England|CM|91|1980|Liverpool>LA Galaxy
Frank Lampard|-|England|CM|90|1978|West Ham>Swansea>West Ham>Chelsea>Man City>New York City FC
Andrea Pirlo|-|Italy|CM|91|1979|Brescia>Inter>Reggina>AC Milan>Juventus>New York City FC
Paul Scholes|-|England|CM|89|1974|Man United
Toni Kroos|-|Germany|CM|90|1990|Bayern>Leverkusen>Bayern>Real Madrid
Lothar Matthäus|-|Germany|CM|93|1961|Gladbach>Bayern>Inter>Bayern>MetroStars
Bastian Schweinsteiger|-|Germany|CM|89|1984|Bayern>Man United>Chicago Fire
Pavel Nedvěd|-|Czech Republic|CM|91|1972|Dukla Prague>Sparta Prague>Lazio>Juventus
Clarence Seedorf|-|Netherlands|CM|90|1976|Ajax>Sampdoria>Real Madrid>Inter>AC Milan>Botafogo
Cesc Fàbregas|-|Spain|CM|88|1987|Arsenal>Barcelona>Chelsea>Monaco>Como
Zinedine Zidane|-|France|CAM|96|1972|Cannes>Bordeaux>Juventus>Real Madrid
Diego Maradona|-|Argentina|CAM|97|1960|Argentinos Juniors>Boca Juniors>Barcelona>Napoli>Sevilla>Newell's Old Boys>Boca Juniors
Ronaldinho|-|Brazil|CAM|94|1980|Grêmio>PSG>Barcelona>AC Milan>Flamengo>Atlético Mineiro>Querétaro>Fluminense
Kaká|-|Brazil|CAM|92|1982|São Paulo>AC Milan>Real Madrid>AC Milan>São Paulo>Orlando City
Francesco Totti|-|Italy|CAM|91|1976|Roma
Michel Platini|-|France|CAM|93|1955|Nancy>Saint-Étienne>Juventus
Ruud Gullit|-|Netherlands|CAM|92|1962|HFC Haarlem>Feyenoord>PSV>AC Milan>Sampdoria>Chelsea
Mesut Özil|-|Germany|CAM|88|1988|Schalke>Werder Bremen>Real Madrid>Arsenal>Fenerbahçe>İstanbul Başakşehir
Rivaldo|-|Brazil|CAM|91|1972|Mogi Mirim>Corinthians>Palmeiras>Deportivo La Coruña>Barcelona>AC Milan>Olympiacos
Bobby Charlton|-|England|CAM|93|1937|Man United>Preston North End
Thomas Müller|-|Germany|CAM|88|1989|Bayern>Vancouver Whitecaps
Luís Figo|-|Portugal|RW|92|1972|Sporting CP>Barcelona>Real Madrid>Inter
Arjen Robben|-|Netherlands|RW|91|1984|Groningen>PSV>Chelsea>Real Madrid>Bayern>Groningen
David Beckham|-|England|RW|90|1975|Man United>Preston North End>Man United>Real Madrid>LA Galaxy>AC Milan>PSG
Gareth Bale|-|Wales|RW|89|1989|Southampton>Tottenham>Real Madrid>Tottenham>Real Madrid>LAFC
Ángel Di María|-|Argentina|RW|88|1988|Rosario Central>Benfica>Real Madrid>Man United>PSG>Juventus>Benfica>Rosario Central
Franck Ribéry|-|France|LW|90|1983|Brest>Metz>Galatasaray>Marseille>Bayern>Fiorentina>Salernitana
Eden Hazard|-|Belgium|LW|90|1991|Lille>Chelsea>Real Madrid
Ryan Giggs|-|Wales|LW|89|1973|Man United
Pelé|-|Brazil|ST|98|1940|Santos>New York Cosmos
Johan Cruyff|-|Netherlands|ST|96|1947|Ajax>Barcelona>Los Angeles Aztecs>Washington Diplomats>Levante>Ajax>Feyenoord
Ronaldo Nazário|Ronaldo (Brazilian footballer)|Brazil|ST|96|1976|Cruzeiro>PSV>Barcelona>Inter>Real Madrid>AC Milan>Corinthians
Thierry Henry|-|France|ST|93|1977|Monaco>Juventus>Arsenal>Barcelona>New York Red Bulls>Arsenal>New York Red Bulls
Zlatan Ibrahimović|-|Sweden|ST|92|1981|Malmö>Ajax>Juventus>Inter>Barcelona>AC Milan>PSG>Man United>LA Galaxy>AC Milan
Wayne Rooney|-|England|ST|91|1985|Everton>Man United>Everton>DC United>Derby County
Didier Drogba|-|Ivory Coast|ST|90|1978|Le Mans>Guingamp>Marseille>Chelsea>Shanghai Shenhua>Galatasaray>Chelsea>Montreal Impact
Samuel Eto'o|-|Cameroon|ST|91|1981|Real Madrid>Leganés>Mallorca>Barcelona>Inter>Anzhi Makhachkala>Chelsea>Everton>Sampdoria
Andriy Shevchenko|-|Ukraine|ST|91|1976|Dynamo Kyiv>AC Milan>Chelsea>AC Milan>Dynamo Kyiv
Alessandro Del Piero|-|Italy|ST|91|1974|Padova>Juventus>Sydney FC
Raúl|Raúl (footballer)|Spain|ST|91|1977|Real Madrid>Schalke>Al Sadd>New York Cosmos
Fernando Torres|-|Spain|ST|88|1984|Atlético Madrid>Liverpool>Chelsea>AC Milan>Atlético Madrid>Sagan Tosu
David Villa|-|Spain|ST|89|1981|Sporting Gijón>Zaragoza>Valencia>Barcelona>Atlético Madrid>New York City FC>Vissel Kobe
Luis Suárez|Luis Suárez (footballer, born 1987)|Uruguay|ST|90|1987|Nacional>Groningen>Ajax>Liverpool>Barcelona>Atlético Madrid>Nacional>Grêmio>Inter Miami
Sergio Agüero|-|Argentina|ST|90|1988|Independiente>Atlético Madrid>Man City>Barcelona
Miroslav Klose|-|Germany|ST|89|1978|Kaiserslautern>Werder Bremen>Bayern>Lazio
Ruud van Nistelrooy|-|Netherlands|ST|89|1976|Den Bosch>Heerenveen>PSV>Man United>Real Madrid>Hamburg>Málaga
Dennis Bergkamp|-|Netherlands|ST|90|1969|Ajax>Inter>Arsenal
Michael Owen|-|England|ST|88|1979|Liverpool>Real Madrid>Newcastle>Man United>Stoke City
Alan Shearer|-|England|ST|90|1970|Southampton>Blackburn>Newcastle
Eric Cantona|-|France|ST|90|1966|Auxerre>Marseille>Bordeaux>Montpellier>Nîmes>Leeds>Man United
Ferenc Puskás|-|Hungary|ST|94|1927|Budapest Honvéd>Real Madrid
Eusébio|-|Portugal|ST|93|1942|Benfica
Alfredo Di Stéfano|-|Argentina|ST|95|1926|River Plate>Huracán>Millonarios>Real Madrid>Espanyol
Gerd Müller|-|Germany|ST|94|1945|Bayern>Fort Lauderdale Strikers
Marco van Basten|-|Netherlands|ST|93|1964|Ajax>AC Milan
Romário|-|Brazil|ST|92|1966|Vasco da Gama>PSV>Barcelona>Flamengo>Valencia
Kenny Dalglish|-|Scotland|ST|91|1951|Celtic>Liverpool
Gary Lineker|-|England|ST|88|1960|Leicester>Everton>Barcelona>Tottenham>Nagoya Grampus
`;

export const NATIONS = {
  'England': 'gb-eng', 'Scotland': 'gb-sct', 'Wales': 'gb-wls', 'Ireland': 'ie',
  'France': 'fr', 'Spain': 'es', 'Germany': 'de', 'Italy': 'it', 'Portugal': 'pt',
  'Netherlands': 'nl', 'Belgium': 'be', 'Brazil': 'br', 'Argentina': 'ar', 'Uruguay': 'uy',
  'Colombia': 'co', 'Ecuador': 'ec', 'USA': 'us', 'Canada': 'ca', 'Norway': 'no',
  'Sweden': 'se', 'Denmark': 'dk', 'Switzerland': 'ch', 'Croatia': 'hr', 'Serbia': 'rs',
  'Slovenia': 'si', 'Poland': 'pl', 'Czech Republic': 'cz', 'Hungary': 'hu', 'Georgia': 'ge',
  'Turkey': 'tr', 'Morocco': 'ma', 'Egypt': 'eg', 'Algeria': 'dz', 'Nigeria': 'ng',
  'Ghana': 'gh', 'Senegal': 'sn', 'Cameroon': 'cm', 'Ivory Coast': 'ci', 'Guinea': 'gn',
  'South Korea': 'kr', 'Japan': 'jp', 'Ukraine': 'ua',
};

export const POS_GROUP = {
  GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LW: 'FWD', RW: 'FWD', ST: 'FWD',
};

export const POS_NAME = {
  GK: 'Goalkeeper', CB: 'Centre-back', LB: 'Left-back', RB: 'Right-back',
  CDM: 'Defensive mid', CM: 'Central mid', CAM: 'Attacking mid',
  LW: 'Left winger', RW: 'Right winger', ST: 'Striker',
};

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parse(block, icon) {
  return block.trim().split(/\r?\n/).map((line) => {
    const [name, wiki, nation, pos, rating, born, clubs] = line.split('|');
    const career = clubs.split('>');
    return {
      id: slug(name),
      name,
      wiki: wiki === '-' ? name : wiki,
      nation,
      pos,
      group: POS_GROUP[pos],
      rating: +rating,
      born: +born,
      career,
      clubs: [...new Set(career)],
      club: career[career.length - 1],
      icon,
    };
  });
}

export const PLAYERS = [...parse(ACTIVE, false), ...parse(ICONS, true)];
export const BY_ID = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));
export const P = (id) => BY_ID[id];
export const ACTIVE_PLAYERS = PLAYERS.filter((p) => !p.icon);

// Short surname-ish label for cards ("Kylian Mbappé" -> "Mbappé").
export function shortName(p) {
  const keep = ['Vinícius Júnior', 'Lamine Yamal', 'Son Heung-min', 'Kim Min-jae',
    'Van Dijk', 'Mac Allister', 'De Bruyne', 'De Jong', 'De Paul', 'Di María', 'Di Stéfano', 'Del Piero',
    'Van Nistelrooy', 'Van Basten', 'Van der Sar', 'Ter Stegen', 'De Ligt', 'Di Lorenzo', 'Van de Ven'];
  if (!p.name.includes(' ')) return p.name;
  const hit = keep.find((k) => p.name.toLowerCase().endsWith(k.toLowerCase()) || p.name === k);
  if (hit) return p.name === hit ? p.name : hit;
  const parts = p.name.split(' ');
  return parts[parts.length - 1];
}

export { slug };
