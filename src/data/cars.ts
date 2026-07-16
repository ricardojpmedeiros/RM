// Portuguese Popular Vehicles Database for Selection Wizard (Vehicles since 2006)
export interface CarEngineVersion {
  name: string; // complete friendly name e.g. "SEAT Leon 1.6 TDI (115cv)"
  type: "electric" | "gasoline" | "diesel" | "hybrid";
  autonomyRange: number; // in km
}

export interface CarModel {
  name: string; // e.g. "Leon"
  years: string[]; // e.g. ["2018-Presente", "2006-2017"]
  versions: {
    [yearRange: string]: CarEngineVersion[];
  };
}

export interface CarBrand {
  brand: string; // e.g. "SEAT"
  models: CarModel[];
}

export const POPULAR_BRANDS: CarBrand[] = [
  {
    brand: "Alfa Romeo",
    models: [
      {
        name: "Giulietta",
        years: ["2016-2020", "2010-2015"],
        versions: {
          "2016-2020": [
            { name: "Alfa Romeo Giulietta 1.6 JTDM (120cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Alfa Romeo Giulietta 1.4 TB (150cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2010-2015": [
            { name: "Alfa Romeo Giulietta 1.6 JTDM (105cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Alfa Romeo Giulietta 1.4 TB (120cv)", type: "gasoline", autonomyRange: 720 }
          ]
        }
      },
      {
        name: "Mito",
        years: ["2008-2018"],
        versions: {
          "2008-2018": [
            { name: "Alfa Romeo MiTo 1.3 JTDM (95cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Alfa Romeo MiTo 1.4 MPI (78cv)", type: "gasoline", autonomyRange: 650 }
          ]
        }
      },
      {
        name: "Giulia",
        years: ["2016-Presente"],
        versions: {
          "2016-Presente": [
            { name: "Alfa Romeo Giulia 2.2 JTDM (150cv/190cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Alfa Romeo Giulia 2.0 Turbo (200cv)", type: "gasoline", autonomyRange: 800 }
          ]
        }
      },
      {
        name: "Stelvio",
        years: ["2017-Presente"],
        versions: {
          "2017-Presente": [
            { name: "Alfa Romeo Stelvio 2.2 JTDM (190cv/210cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Alfa Romeo Stelvio 2.0 Turbo (280cv)", type: "gasoline", autonomyRange: 750 }
          ]
        }
      },
      {
        name: "Tonale",
        years: ["2022-Presente"],
        versions: {
          "2022-Presente": [
            { name: "Alfa Romeo Tonale 1.5 MHEV Hybrid (130cv/160cv)", type: "hybrid", autonomyRange: 850 },
            { name: "Alfa Romeo Tonale 1.3 PHEV Q4 (280cv)", type: "hybrid", autonomyRange: 800 }
          ]
        }
      }
    ]
  },
  {
    brand: "Audi",
    models: [
      {
        name: "A1",
        years: ["2018-Presente", "2010-2017"],
        versions: {
          "2018-Presente": [
            { name: "Audi A1 Sportback 30 TFSI (110cv)", type: "gasoline", autonomyRange: 750 },
            { name: "Audi A1 Sportback 25 TFSI (95cv)", type: "gasoline", autonomyRange: 780 }
          ],
          "2010-2017": [
            { name: "Audi A1 1.6 TDI (105cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Audi A1 1.2 TFSI (86cv)", type: "gasoline", autonomyRange: 700 }
          ]
        }
      },
      {
        name: "A3",
        years: ["2020-Presente", "2012-2019", "2003-2011"],
        versions: {
          "2020-Presente": [
            { name: "Audi A3 Sportback 30 TDI (116cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Audi A3 Sportback 30 TFSI MHEV (110cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2012-2019": [
            { name: "Audi A3 Sportback 1.6 TDI (110cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Audi A3 Sportback 1.0 TFSI (116cv)", type: "gasoline", autonomyRange: 760 }
          ],
          "2003-2011": [
            { name: "Audi A3 1.9 TDI (105cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Audi A3 2.0 TDI (140cv)", type: "diesel", autonomyRange: 980 }
          ]
        }
      },
      {
        name: "A4",
        years: ["2015-Presente", "2008-2015", "2004-2007"],
        versions: {
          "2015-Presente": [
            { name: "Audi A4 Avant 2.0 TDI (150cv)", type: "diesel", autonomyRange: 1150 },
            { name: "Audi A4 Avant 30 TDI MHEV (136cv)", type: "hybrid", autonomyRange: 1100 }
          ],
          "2008-2015": [
            { name: "Audi A4 Avant 2.0 TDI (143cv)", type: "diesel", autonomyRange: 1200 },
            { name: "Audi A4 Avant 1.8 TFSI (120cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2004-2007": [
            { name: "Audi A4 2.0 TDI (140cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Audi A4 1.9 TDI (115cv)", type: "diesel", autonomyRange: 1180 }
          ]
        }
      },
      {
        name: "A5",
        years: ["2016-Presente", "2007-2015"],
        versions: {
          "2016-Presente": [
            { name: "Audi A5 Sportback 35 TDI (163cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Audi A5 Sportback 40 TFSI (204cv)", type: "gasoline", autonomyRange: 800 }
          ],
          "2007-2015": [
            { name: "Audi A5 Coupe 2.0 TDI (177cv)", type: "diesel", autonomyRange: 1150 },
            { name: "Audi A5 Sportback 3.0 TDI (245cv)", type: "diesel", autonomyRange: 980 }
          ]
        }
      },
      {
        name: "A6",
        years: ["2018-Presente", "2011-2018"],
        versions: {
          "2018-Presente": [
            { name: "Audi A6 Avant 40 TDI (204cv) MHEV", type: "hybrid", autonomyRange: 1200 },
            { name: "Audi A6 Avant 50 TFSIe (299cv) PHEV", type: "hybrid", autonomyRange: 900 }
          ],
          "2011-2018": [
            { name: "Audi A6 Avant 2.0 TDI (177cv/190cv)", type: "diesel", autonomyRange: 1250 },
            { name: "Audi A6 Avant 3.0 TDI (245cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "Q2",
        years: ["2016-Presente"],
        versions: {
          "2016-Presente": [
            { name: "Audi Q2 30 TDI (116cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Audi Q2 30 TFSI (110cv)", type: "gasoline", autonomyRange: 750 }
          ]
        }
      },
      {
        name: "Q3",
        years: ["2018-Presente", "2011-2017"],
        versions: {
          "2018-Presente": [
            { name: "Audi Q3 35 TDI (150cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Audi Q3 35 TFSI (150cv)", type: "gasoline", autonomyRange: 780 }
          ],
          "2011-2017": [
            { name: "Audi Q3 2.0 TDI (140cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Audi Q3 1.4 TFSI (150cv)", type: "gasoline", autonomyRange: 720 }
          ]
        }
      },
      {
        name: "Q5",
        years: ["2017-Presente", "2008-2016"],
        versions: {
          "2017-Presente": [
            { name: "Audi Q5 35 TDI (163cv)", type: "diesel", autonomyRange: 1150 },
            { name: "Audi Q5 50 TFSIe PHEV (299cv)", type: "hybrid", autonomyRange: 950 }
          ],
          "2008-2016": [
            { name: "Audi Q5 2.0 TDI (143cv/170cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Audi Q5 3.0 TDI (240cv)", type: "diesel", autonomyRange: 950 }
          ]
        }
      },
      {
        name: "e-tron",
        years: ["2019-Presente"],
        versions: {
          "2019-Presente": [
            { name: "Audi e-tron 55 quattro (95 kWh)", type: "electric", autonomyRange: 410 },
            { name: "Audi Q8 e-tron 50 (89 kWh)", type: "electric", autonomyRange: 480 }
          ]
        }
      }
    ]
  },
  {
    brand: "BMW",
    models: [
      {
        name: "Série 1",
        years: ["2019-Presente", "2011-2018", "2004-2010"],
        versions: {
          "2019-Presente": [
            { name: "BMW 116d (116cv)", type: "diesel", autonomyRange: 1000 },
            { name: "BMW 118i (136cv)", type: "gasoline", autonomyRange: 720 }
          ],
          "2011-2018": [
            { name: "BMW 116d (116cv) EfficientDynamics", type: "diesel", autonomyRange: 1150 },
            { name: "BMW 118d (143cv/150cv)", type: "diesel", autonomyRange: 1100 }
          ],
          "2004-2010": [
            { name: "BMW 118d (122cv/143cv)", type: "diesel", autonomyRange: 960 },
            { name: "BMW 120d (163cv/177cv)", type: "diesel", autonomyRange: 920 }
          ]
        }
      },
      {
        name: "Série 2",
        years: ["2014-Presente"],
        versions: {
          "2014-Presente": [
            { name: "BMW 225xe Active Tourer PHEV (224cv)", type: "hybrid", autonomyRange: 800 },
            { name: "BMW 216d Active Tourer (116cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      },
      {
        name: "Série 3",
        years: ["2019-Presente", "2012-2018", "2005-2011"],
        versions: {
          "2019-Presente": [
            { name: "BMW 320d Sedan MHEV (190cv)", type: "hybrid", autonomyRange: 1150 },
            { name: "BMW 330e PHEV (292cv)", type: "hybrid", autonomyRange: 800 }
          ],
          "2012-2018": [
            { name: "BMW 320d EfficientDynamics (163cv)", type: "diesel", autonomyRange: 1300 },
            { name: "BMW 320d (184cv/190cv)", type: "diesel", autonomyRange: 1200 }
          ],
          "2005-2011": [
            { name: "BMW 320d (163cv/177cv)", type: "diesel", autonomyRange: 1100 },
            { name: "BMW 318d (122cv/143cv)", type: "diesel", autonomyRange: 1150 }
          ]
        }
      },
      {
        name: "Série 4",
        years: ["2020-Presente", "2013-2019"],
        versions: {
          "2020-Presente": [
            { name: "BMW 420d Gran Coupe (190cv)", type: "diesel", autonomyRange: 1100 },
            { name: "BMW i4 eDrive40 Elétrico (80.7 kWh)", type: "electric", autonomyRange: 580 }
          ],
          "2013-2019": [
            { name: "BMW 420d Gran Coupe (184cv/190cv)", type: "diesel", autonomyRange: 1150 },
            { name: "BMW 420i Gran Coupe (184cv)", type: "gasoline", autonomyRange: 780 }
          ]
        }
      },
      {
        name: "Série 5",
        years: ["2017-2023", "2010-2016", "2003-2009"],
        versions: {
          "2017-2023": [
            { name: "BMW 520d (190cv)", type: "diesel", autonomyRange: 1200 },
            { name: "BMW 530e PHEV (252cv)", type: "hybrid", autonomyRange: 850 }
          ],
          "2010-2016": [
            { name: "BMW 520d (184cv)", type: "diesel", autonomyRange: 1250 },
            { name: "BMW 530d (258cv)", type: "diesel", autonomyRange: 1100 }
          ],
          "2003-2009": [
            { name: "BMW 520d (163cv/177cv)", type: "diesel", autonomyRange: 1100 },
            { name: "BMW 530d (218cv/231cv)", type: "diesel", autonomyRange: 1080 }
          ]
        }
      },
      {
        name: "X1",
        years: ["2022-Presente", "2015-2022", "2009-2015"],
        versions: {
          "2022-Presente": [
            { name: "BMW X1 sDrive18d (150cv)", type: "diesel", autonomyRange: 1050 },
            { name: "BMW iX1 xDrive30 EV (64.7 kWh)", type: "electric", autonomyRange: 420 }
          ],
          "2015-2022": [
            { name: "BMW X1 sDrive16d (116cv)", type: "diesel", autonomyRange: 1100 },
            { name: "BMW X1 sDrive18d (150cv)", type: "diesel", autonomyRange: 1050 }
          ],
          "2009-2015": [
            { name: "BMW X1 sDrive18d (143cv)", type: "diesel", autonomyRange: 1150 },
            { name: "BMW X1 sDrive20d (177cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "X3",
        years: ["2017-Presente", "2010-2017"],
        versions: {
          "2017-Presente": [
            { name: "BMW X3 xDrive20d (190cv)", type: "diesel", autonomyRange: 1050 },
            { name: "BMW iX3 Elétrico (80 kWh)", type: "electric", autonomyRange: 460 }
          ],
          "2010-2017": [
            { name: "BMW X3 xDrive20d (184cv)", type: "diesel", autonomyRange: 1100 },
            { name: "BMW X3 xDrive30d (258cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      },
      {
        name: "i3",
        years: ["2013-2022"],
        versions: {
          "2013-2022": [
            { name: "BMW i3 120 Ah Elétrico (42.2 kWh)", type: "electric", autonomyRange: 310 },
            { name: "BMW i3 94 Ah Elétrico (33 kWh)", type: "electric", autonomyRange: 200 }
          ]
        }
      }
    ]
  },
  {
    brand: "Citroën",
    models: [
      {
        name: "C1",
        years: ["2014-2021", "2005-2013"],
        versions: {
          "2014-2021": [
            { name: "Citroën C1 1.0 VTi (72cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2005-2013": [
            { name: "Citroën C1 1.0 i (68cv)", type: "gasoline", autonomyRange: 700 }
          ]
        }
      },
      {
        name: "C3",
        years: ["2020-Presente", "2016-2019", "2009-2015", "2002-2009"],
        versions: {
          "2020-Presente": [
            { name: "Citroën C3 1.2 PureTech (83cv/110cv)", type: "gasoline", autonomyRange: 750 },
            { name: "Citroën ë-C3 Elétrico (44 kWh)", type: "electric", autonomyRange: 320 }
          ],
          "2016-2019": [
            { name: "Citroën C3 1.6 BlueHDi (100cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Citroën C3 1.2 PureTech (82cv)", type: "gasoline", autonomyRange: 720 }
          ],
          "2009-2015": [
            { name: "Citroën C3 1.4 HDi (70cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Citroën C3 1.6 e-HDi (92cv)", type: "diesel", autonomyRange: 1150 }
          ],
          "2002-2009": [
            { name: "Citroën C3 1.4 HDi (70cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Citroën C3 1.4 i (75cv)", type: "gasoline", autonomyRange: 650 }
          ]
        }
      },
      {
        name: "C3 Aircross",
        years: ["2017-Presente"],
        versions: {
          "2017-Presente": [
            { name: "Citroën C3 Aircross 1.5 BlueHDi (110cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Citroën C3 Aircross 1.2 PureTech (110cv)", type: "gasoline", autonomyRange: 760 }
          ]
        }
      },
      {
        name: "C4",
        years: ["2020-Presente", "2010-2018", "2004-2010"],
        versions: {
          "2020-Presente": [
            { name: "Citroën C4 1.5 BlueHDi (110cv)", type: "diesel", autonomyRange: 980 },
            { name: "Citroën ë-C4 Elétrico (50 kWh)", type: "electric", autonomyRange: 350 }
          ],
          "2010-2018": [
            { name: "Citroën C4 1.6 e-HDi (115cv)", type: "diesel", autonomyRange: 1150 },
            { name: "Citroën C4 1.6 BlueHDi (120cv)", type: "diesel", autonomyRange: 1200 }
          ],
          "2004-2010": [
            { name: "Citroën C4 1.6 HDi (90cv/110cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Citroën C4 1.4 i (90cv)", type: "gasoline", autonomyRange: 680 }
          ]
        }
      },
      {
        name: "C4 Cactus",
        years: ["2018-2020", "2014-2017"],
        versions: {
          "2018-2020": [
            { name: "Citroën C4 Cactus 1.5 BlueHDi (100cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Citroën C4 Cactus 1.2 PureTech (110cv)", type: "gasoline", autonomyRange: 800 }
          ],
          "2014-2017": [
            { name: "Citroën C4 Cactus 1.6 BlueHDi (100cv)", type: "diesel", autonomyRange: 1200 },
            { name: "Citroën C4 Cactus 1.2 PureTech (82cv)", type: "gasoline", autonomyRange: 750 }
          ]
        }
      },
      {
        name: "C5 Aircross",
        years: ["2018-Presente"],
        versions: {
          "2018-Presente": [
            { name: "Citroën C5 Aircross 1.5 BlueHDi (130cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Citroën C5 Aircross PHEV (225cv)", type: "hybrid", autonomyRange: 850 }
          ]
        }
      },
      {
        name: "Berlingo",
        years: ["2018-Presente", "2008-2018"],
        versions: {
          "2018-Presente": [
            { name: "Citroën Berlingo 1.5 BlueHDi (100cv/130cv)", type: "diesel", autonomyRange: 950 },
            { name: "Citroën ë-Berlingo Elétrico (50 kWh)", type: "electric", autonomyRange: 280 }
          ],
          "2008-2018": [
            { name: "Citroën Berlingo 1.6 HDi (90cv/115cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      }
    ]
  },
  {
    brand: "Dacia",
    models: [
      {
        name: "Sandero",
        years: ["2021-Presente", "2013-2020", "2008-2012"],
        versions: {
          "2021-Presente": [
            { name: "Dacia Sandero ECO-G 100 GPL/Gasolina", type: "hybrid", autonomyRange: 1100 },
            { name: "Dacia Sandero TCe 90 (90cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2013-2020": [
            { name: "Dacia Sandero 1.5 dCi (90cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Dacia Sandero 0.9 TCe (90cv)", type: "gasoline", autonomyRange: 700 }
          ],
          "2008-2012": [
            { name: "Dacia Sandero 1.5 dCi (75cv/85cv)", type: "diesel", autonomyRange: 950 },
            { name: "Dacia Sandero 1.2 16V (75cv)", type: "gasoline", autonomyRange: 680 }
          ]
        }
      },
      {
        name: "Duster",
        years: ["2018-Presente", "2010-2017"],
        versions: {
          "2018-Presente": [
            { name: "Dacia Duster 1.5 BlueHDi (115cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Dacia Duster 1.0 TCe ECO-G GPL (100cv)", type: "hybrid", autonomyRange: 1150 }
          ],
          "2010-2017": [
            { name: "Dacia Duster 1.5 dCi (110cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Dacia Duster 1.6 16V (105cv)", type: "gasoline", autonomyRange: 680 }
          ]
        }
      },
      {
        name: "Jogger",
        years: ["2022-Presente"],
        versions: {
          "2022-Presente": [
            { name: "Dacia Jogger Hybrid 140 Híbrido (1.6)", type: "hybrid", autonomyRange: 900 },
            { name: "Dacia Jogger ECO-G 100 GPL/Gasolina", type: "hybrid", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "Spring",
        years: ["2021-Presente"],
        versions: {
          "2021-Presente": [
            { name: "Dacia Spring Elétrico (26.8 kWh)", type: "electric", autonomyRange: 230 }
          ]
        }
      }
    ]
  },
  {
    brand: "Fiat",
    models: [
      {
        name: "500",
        years: ["500e Elétrico (2020+)", "Hybrid/Combustão (2015+)", "Clássico (2007-2014)"],
        versions: {
          "500e Elétrico (2020+)": [
            { name: "Fiat 500e Elétrico (42 kWh)", type: "electric", autonomyRange: 320 }
          ],
          "Hybrid/Combustão (2015+)": [
            { name: "Fiat 500 1.0 Mild Hybrid (70cv)", type: "hybrid", autonomyRange: 750 },
            { name: "Fiat 500 1.2 Fire (69cv)", type: "gasoline", autonomyRange: 640 }
          ],
          "Clássico (2007-2014)": [
            { name: "Fiat 500 1.3 Multijet Diesel (75cv)", type: "diesel", autonomyRange: 900 },
            { name: "Fiat 500 1.2 Fire (69cv)", type: "gasoline", autonomyRange: 620 }
          ]
        }
      },
      {
        name: "Punto",
        years: ["Grande Punto/Evo (2005-2018)", "Punto II (1999-2005)"],
        versions: {
          "Grande Punto/Evo (2005-2018)": [
            { name: "Fiat Grande Punto 1.3 Multijet (75cv/90cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Fiat Grande Punto 1.2 Fire (65cv)", type: "gasoline", autonomyRange: 680 }
          ],
          "Punto II (1999-2005)": [
            { name: "Fiat Punto 1.3 Multijet (70cv)", type: "diesel", autonomyRange: 950 },
            { name: "Fiat Punto 1.2 8V (60cv)", type: "gasoline", autonomyRange: 630 }
          ]
        }
      },
      {
        name: "Panda",
        years: ["2012-Presente", "2003-2011"],
        versions: {
          "2012-Presente": [
            { name: "Fiat Panda 1.0 Hybrid (70cv)", type: "hybrid", autonomyRange: 750 },
            { name: "Fiat Panda 1.2 Fire (69cv)", type: "gasoline", autonomyRange: 680 }
          ],
          "2003-2011": [
            { name: "Fiat Panda 1.3 Multijet (70cv)", type: "diesel", autonomyRange: 900 },
            { name: "Fiat Panda 1.2 Fire (60cv)", type: "gasoline", autonomyRange: 600 }
          ]
        }
      },
      {
        name: "Tipo",
        years: ["2016-Presente"],
        versions: {
          "2016-Presente": [
            { name: "Fiat Tipo 1.3 Multijet (95cv) Diesel", type: "diesel", autonomyRange: 1000 },
            { name: "Fiat Tipo 1.6 Multijet (120cv/130cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Fiat Tipo 1.5 MHEV Hybrid (130cv)", type: "hybrid", autonomyRange: 850 }
          ]
        }
      },
      {
        name: "500X",
        years: ["2015-Presente"],
        versions: {
          "2015-Presente": [
            { name: "Fiat 500X 1.3 Multijet (95cv) Diesel", type: "diesel", autonomyRange: 950 },
            { name: "Fiat 500X 1.6 Multijet (120cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Fiat 500X 1.5 Mild Hybrid (130cv)", type: "hybrid", autonomyRange: 800 }
          ]
        }
      }
    ]
  },
  {
    brand: "Ford",
    models: [
      {
        name: "Fiesta",
        years: ["2017-2023", "2008-2016", "2002-2008"],
        versions: {
          "2017-2023": [
            { name: "Ford Fiesta 1.0 EcoBoost Hybrid (125cv)", type: "hybrid", autonomyRange: 820 },
            { name: "Ford Fiesta 1.0 EcoBoost (100cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2008-2016": [
            { name: "Ford Fiesta 1.4 TDCi (70cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Ford Fiesta 1.6 TDCi (95cv) ECOnetic", type: "diesel", autonomyRange: 1150 }
          ],
          "2002-2008": [
            { name: "Ford Fiesta 1.4 TDCi (68cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Ford Fiesta 1.25 Duratec (75cv)", type: "gasoline", autonomyRange: 620 }
          ]
        }
      },
      {
        name: "Focus",
        years: ["2018-Presente", "2011-2017", "2004-2010"],
        versions: {
          "2018-Presente": [
            { name: "Ford Focus 1.5 EcoBlue Diesel (120cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Ford Focus 1.0 EcoBoost Hybrid (125cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2011-2017": [
            { name: "Ford Focus 1.6 TDCi (115cv)", type: "diesel", autonomyRange: 1080 },
            { name: "Ford Focus 1.5 TDCi (120cv)", type: "diesel", autonomyRange: 1100 }
          ],
          "2004-2010": [
            { name: "Ford Focus 1.6 TDCi (90cv/110cv)", type: "diesel", autonomyRange: 1080 },
            { name: "Ford Focus 1.6 Duratec (100cv)", type: "gasoline", autonomyRange: 680 }
          ]
        }
      },
      {
        name: "Puma",
        years: ["2020-Presente"],
        versions: {
          "2020-Presente": [
            { name: "Ford Puma 1.0 EcoBoost Hybrid (125cv)", type: "hybrid", autonomyRange: 800 },
            { name: "Ford Puma 1.0 EcoBoost Hybrid (155cv)", type: "hybrid", autonomyRange: 760 }
          ]
        }
      },
      {
        name: "Kuga",
        years: ["2020-Presente", "2013-2019"],
        versions: {
          "2020-Presente": [
            { name: "Ford Kuga 2.5 Duratec PHEV (225cv)", type: "hybrid", autonomyRange: 900 },
            { name: "Ford Kuga 1.5 EcoBlue Diesel (120cv)", type: "diesel", autonomyRange: 1000 }
          ],
          "2013-2019": [
            { name: "Ford Kuga 2.0 TDCi (150cv) Diesel", type: "diesel", autonomyRange: 1050 }
          ]
        }
      }
    ]
  },
  {
    brand: "Honda",
    models: [
      {
        name: "Civic",
        years: ["2022-Presente", "2017-2021", "2006-2011"],
        versions: {
          "2022-Presente": [
            { name: "Honda Civic e:HEV Full Hybrid (184cv)", type: "hybrid", autonomyRange: 850 }
          ],
          "2017-2021": [
            { name: "Honda Civic 1.0 i-VTEC Turbo (126cv)", type: "gasoline", autonomyRange: 760 },
            { name: "Honda Civic 1.6 i-DTEC Diesel (120cv)", type: "diesel", autonomyRange: 1050 }
          ],
          "2006-2011": [
            { name: "Honda Civic 1.4 i-DSI (83cv)", type: "gasoline", autonomyRange: 680 },
            { name: "Honda Civic 2.2 i-CTDi Diesel (140cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      },
      {
        name: "Jazz",
        years: ["2020-Presente", "2015-2019", "2008-2014"],
        versions: {
          "2020-Presente": [
            { name: "Honda Jazz e:HEV Hybrid (109cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2015-2019": [
            { name: "Honda Jazz 1.3 i-VTEC (102cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2008-2014": [
            { name: "Honda Jazz 1.2 i-VTEC (90cv)", type: "gasoline", autonomyRange: 680 },
            { name: "Honda Jazz 1.3 Hybrid (100cv)", type: "hybrid", autonomyRange: 780 }
          ]
        }
      }
    ]
  },
  {
    brand: "Hyundai",
    models: [
      {
        name: "i10",
        years: ["2020-Presente", "2013-2019"],
        versions: {
          "2020-Presente": [
            { name: "Hyundai i10 1.0 MPi (67cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2013-2019": [
            { name: "Hyundai i10 1.0 MPi (66cv)", type: "gasoline", autonomyRange: 700 }
          ]
        }
      },
      {
        name: "i20",
        years: ["2020-Presente", "2014-2019"],
        versions: {
          "2020-Presente": [
            { name: "Hyundai i20 1.0 T-GDi MHEV (100cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2014-2019": [
            { name: "Hyundai i20 1.1 CRDi Diesel (75cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Hyundai i20 1.2 MPi (84cv)", type: "gasoline", autonomyRange: 720 }
          ]
        }
      },
      {
        name: "i30",
        years: ["2017-Presente", "2012-2016"],
        versions: {
          "2017-Presente": [
            { name: "Hyundai i30 1.6 CRDi (115cv/136cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Hyundai i30 1.0 T-GDi (120cv)", type: "gasoline", autonomyRange: 780 }
          ],
          "2012-2016": [
            { name: "Hyundai i30 1.6 CRDi (110cv)", type: "diesel", autonomyRange: 1150 }
          ]
        }
      },
      {
        name: "Kona",
        years: ["2023-Presente", "2017-2022"],
        versions: {
          "2023-Presente": [
            { name: "Hyundai Kona 1.6 Hybrid (141cv)", type: "hybrid", autonomyRange: 880 },
            { name: "Hyundai Kona EV Elétrico (65 kWh)", type: "electric", autonomyRange: 514 }
          ],
          "2017-2022": [
            { name: "Hyundai Kona 1.0 T-GDi (120cv)", type: "gasoline", autonomyRange: 750 },
            { name: "Hyundai Kona EV Elétrico (64 kWh)", type: "electric", autonomyRange: 484 }
          ]
        }
      },
      {
        name: "Tucson",
        years: ["2020-Presente", "2015-2019"],
        versions: {
          "2020-Presente": [
            { name: "Hyundai Tucson 1.6 CRDi MHEV (136cv)", type: "hybrid", autonomyRange: 980 },
            { name: "Hyundai Tucson 1.6 HEV Híbrido (230cv)", type: "hybrid", autonomyRange: 850 }
          ],
          "2015-2019": [
            { name: "Hyundai Tucson 1.7 CRDi (115cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "IONIQ 5",
        years: ["2021-Presente"],
        versions: {
          "2021-Presente": [
            { name: "Hyundai IONIQ 5 EV (77 kWh)", type: "electric", autonomyRange: 507 },
            { name: "Hyundai IONIQ 5 EV (58 kWh)", type: "electric", autonomyRange: 384 }
          ]
        }
      }
    ]
  },
  {
    brand: "Kia",
    models: [
      {
        name: "Picanto",
        years: ["2017-Presente"],
        versions: {
          "2017-Presente": [
            { name: "Kia Picanto 1.0 MPi (67cv)", type: "gasoline", autonomyRange: 720 }
          ]
        }
      },
      {
        name: "Stonic",
        years: ["2017-Presente"],
        versions: {
          "2017-Presente": [
            { name: "Kia Stonic 1.0 T-GDi MHEV (100cv/120cv)", type: "hybrid", autonomyRange: 800 },
            { name: "Kia Stonic 1.6 CRDi Diesel (110cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      },
      {
        name: "Ceed",
        years: ["2018-Presente", "2012-2017"],
        versions: {
          "2018-Presente": [
            { name: "Kia Ceed 1.6 CRDi MHEV (136cv)", type: "hybrid", autonomyRange: 1050 },
            { name: "Kia Ceed 1.0 T-GDi (120cv)", type: "gasoline", autonomyRange: 780 }
          ],
          "2012-2017": [
            { name: "Kia Cee'd 1.6 CRDi (110cv/128cv)", type: "diesel", autonomyRange: 1150 }
          ]
        }
      },
      {
        name: "Niro",
        years: ["2022-Presente", "2016-2021"],
        versions: {
          "2022-Presente": [
            { name: "Kia Niro 1.6 GDi HEV Hybrid (141cv)", type: "hybrid", autonomyRange: 900 },
            { name: "Kia e-Niro EV Elétrico (64.8 kWh)", type: "electric", autonomyRange: 460 }
          ],
          "2016-2021": [
            { name: "Kia Niro HEV Hybrid (141cv)", type: "hybrid", autonomyRange: 850 },
            { name: "Kia e-Niro EV Elétrico (64 kWh)", type: "electric", autonomyRange: 455 }
          ]
        }
      },
      {
        name: "Sportage",
        years: ["2022-Presente", "2016-2021"],
        versions: {
          "2022-Presente": [
            { name: "Kia Sportage 1.6 CRDi MHEV (136cv)", type: "hybrid", autonomyRange: 950 },
            { name: "Kia Sportage 1.6 HEV Híbrido (230cv)", type: "hybrid", autonomyRange: 880 }
          ],
          "2016-2021": [
            { name: "Kia Sportage 1.7 CRDi (115cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "EV6",
        years: ["2021-Presente"],
        versions: {
          "2021-Presente": [
            { name: "Kia EV6 Elétrico (77.4 kWh)", type: "electric", autonomyRange: 528 },
            { name: "Kia EV6 GT Elétrico (77.4 kWh)", type: "electric", autonomyRange: 424 }
          ]
        }
      }
    ]
  },
  {
    brand: "Mercedes-Benz",
    models: [
      {
        name: "Classe A",
        years: ["2018-Presente", "2012-2017", "2004-2012"],
        versions: {
          "2018-Presente": [
            { name: "Mercedes A180d 2.0 (116cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Mercedes A250e PHEV (218cv)", type: "hybrid", autonomyRange: 850 }
          ],
          "2012-2017": [
            { name: "Mercedes A180d 1.5 (109cv)", type: "diesel", autonomyRange: 1150 },
            { name: "Mercedes A200d 2.1 (136cv)", type: "diesel", autonomyRange: 1100 }
          ],
          "2004-2012": [
            { name: "Mercedes A180 CDI 2.0 (109cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      },
      {
        name: "Classe B",
        years: ["2019-Presente", "2011-2018"],
        versions: {
          "2019-Presente": [
            { name: "Mercedes B180d (116cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Mercedes B250e PHEV (218cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2011-2018": [
            { name: "Mercedes B180d 1.5 (109cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "Classe C",
        years: ["2021-Presente", "2014-2020", "2007-2013", "2000-2006"],
        versions: {
          "2021-Presente": [
            { name: "Mercedes C220d MHEV (200cv)", type: "hybrid", autonomyRange: 1200 },
            { name: "Mercedes C300e PHEV (313cv)", type: "hybrid", autonomyRange: 950 }
          ],
          "2014-2020": [
            { name: "Mercedes C220d (170cv/194cv)", type: "diesel", autonomyRange: 1250 },
            { name: "Mercedes C300de Diesel-PHEV", type: "hybrid", autonomyRange: 1050 }
          ],
          "2007-2013": [
            { name: "Mercedes C220 CDI (170cv)", type: "diesel", autonomyRange: 1150 }
          ],
          "2000-2006": [
            { name: "Mercedes C220 CDI (143cv/150cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "CLA",
        years: ["2019-Presente", "2013-2018"],
        versions: {
          "2019-Presente": [
            { name: "Mercedes CLA 180d Coupe (116cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Mercedes CLA 250e PHEV (218cv)", type: "hybrid", autonomyRange: 850 }
          ],
          "2013-2018": [
            { name: "Mercedes CLA 180d Shooting Brake (109cv)", type: "diesel", autonomyRange: 1150 },
            { name: "Mercedes CLA 200d (136cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "GLA",
        years: ["2020-Presente", "2014-2019"],
        versions: {
          "2020-Presente": [
            { name: "Mercedes GLA 200d (150cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Mercedes GLA 250e PHEV (218cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2014-2019": [
            { name: "Mercedes GLA 180d (109cv) Diesel", type: "diesel", autonomyRange: 1100 },
            { name: "Mercedes GLA 200d (136cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      }
    ]
  },
  {
    brand: "Nissan",
    models: [
      {
        name: "Micra",
        years: ["2017-2022", "2003-2009"],
        versions: {
          "2017-2022": [
            { name: "Nissan Micra 1.0 IG-T (92cv/100cv)", type: "gasoline", autonomyRange: 740 }
          ],
          "2003-2009": [
            { name: "Nissan Micra 1.5 dCi Diesel (82cv)", type: "diesel", autonomyRange: 980 }
          ]
        }
      },
      {
        name: "Juke",
        years: ["2020-Presente", "2010-2019"],
        versions: {
          "2020-Presente": [
            { name: "Nissan Juke 1.0 DIG-T (114cv)", type: "gasoline", autonomyRange: 700 },
            { name: "Nissan Juke 1.6 Hybrid (143cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2010-2019": [
            { name: "Nissan Juke 1.5 dCi Diesel (110cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      },
      {
        name: "Qashqai",
        years: ["2021-Presente", "2014-2020", "2007-2013"],
        versions: {
          "2021-Presente": [
            { name: "Nissan Qashqai 1.3 DIG-T MHEV (140cv)", type: "hybrid", autonomyRange: 800 },
            { name: "Nissan Qashqai e-POWER Hybrid (190cv)", type: "hybrid", autonomyRange: 950 }
          ],
          "2014-2020": [
            { name: "Nissan Qashqai 1.5 dCi (110cv/115cv)", type: "diesel", autonomyRange: 1200 },
            { name: "Nissan Qashqai 1.6 dCi (130cv)", type: "diesel", autonomyRange: 1100 }
          ],
          "2007-2013": [
            { name: "Nissan Qashqai 1.5 dCi (106cv/110cv)", type: "diesel", autonomyRange: 1150 }
          ]
        }
      },
      {
        name: "Leaf",
        years: ["2018-Presente", "2010-2017"],
        versions: {
          "2018-Presente": [
            { name: "Nissan Leaf Elétrico (40 kWh)", type: "electric", autonomyRange: 270 },
            { name: "Nissan Leaf e+ Elétrico (62 kWh)", type: "electric", autonomyRange: 385 }
          ],
          "2010-2017": [
            { name: "Nissan Leaf Elétrico (24 kWh/30 kWh)", type: "electric", autonomyRange: 150 }
          ]
        }
      }
    ]
  },
  {
    brand: "Opel",
    models: [
      {
        name: "Corsa",
        years: ["2020-Presente", "2015-2019", "2006-2014"],
        versions: {
          "2020-Presente": [
            { name: "Opel Corsa 1.2 Turbo (100cv)", type: "gasoline", autonomyRange: 720 },
            { name: "Opel Corsa-e Elétrico (50 kWh)", type: "electric", autonomyRange: 350 }
          ],
          "2015-2019": [
            { name: "Opel Corsa 1.3 CDTI Diesel (95cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Opel Corsa 1.2 (75cv)", type: "gasoline", autonomyRange: 650 }
          ],
          "2006-2014": [
            { name: "Opel Corsa 1.3 CDTI (75cv/90cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      },
      {
        name: "Astra",
        years: ["2022-Presente", "2016-2021", "2004-2009"],
        versions: {
          "2022-Presente": [
            { name: "Opel Astra 1.2 Turbo (130cv)", type: "gasoline", autonomyRange: 720 },
            { name: "Opel Astra 1.5 CDTI Diesel (130cv)", type: "diesel", autonomyRange: 980 }
          ],
          "2016-2021": [
            { name: "Opel Astra 1.6 CDTI Diesel (110cv/136cv)", type: "diesel", autonomyRange: 1100 }
          ],
          "2004-2009": [
            { name: "Opel Astra 1.3 CDTI (90cv)", type: "diesel", autonomyRange: 1080 }
          ]
        }
      },
      {
        name: "Mokka",
        years: ["2021-Presente"],
        versions: {
          "2021-Presente": [
            { name: "Opel Mokka 1.2 Turbo (100cv)", type: "gasoline", autonomyRange: 700 },
            { name: "Opel Mokka-e Elétrico (50 kWh)", type: "electric", autonomyRange: 330 }
          ]
        }
      }
    ]
  },
  {
    brand: "Peugeot",
    models: [
      {
        name: "207 / 208",
        years: ["2020-Presente (208 II)", "2012-2019 (208 I)", "2006-2012 (Peugeot 207)"],
        versions: {
          "2020-Presente (208 II)": [
            { name: "Peugeot 208 1.2 PureTech (100cv)", type: "gasoline", autonomyRange: 700 },
            { name: "Peugeot e-208 Elétrico (50 kWh)", type: "electric", autonomyRange: 340 }
          ],
          "2012-2019 (208 I)": [
            { name: "Peugeot 208 1.6 BlueHDi (100cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Peugeot 208 1.2 PureTech (82cv)", type: "gasoline", autonomyRange: 740 }
          ],
          "2006-2012 (Peugeot 207)": [
            { name: "Peugeot 207 1.4 HDi (68cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Peugeot 207 1.6 HDi (90cv/110cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "307 / 308",
        years: ["2021-Presente (308 III)", "2013-2020 (308 II)", "2001-2008 (Peugeot 307)"],
        versions: {
          "2021-Presente (308 III)": [
            { name: "Peugeot 308 1.5 BlueHDi (130cv)", type: "diesel", autonomyRange: 950 },
            { name: "Peugeot 308 Hybrid PHEV (180cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2013-2020 (308 II)": [
            { name: "Peugeot 308 1.6 BlueHDi (120cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Peugeot 308 1.5 BlueHDi (130cv)", type: "diesel", autonomyRange: 1080 }
          ],
          "2001-2008 (Peugeot 307)": [
            { name: "Peugeot 307 1.4 HDi (68cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Peugeot 307 1.6 HDi (90cv/110cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "2008",
        years: ["2020-Presente", "2013-2019"],
        versions: {
          "2020-Presente": [
            { name: "Peugeot 2008 1.2 PureTech (130cv)", type: "gasoline", autonomyRange: 700 },
            { name: "Peugeot e-2008 Elétrico (50 kWh)", type: "electric", autonomyRange: 340 }
          ],
          "2013-2019": [
            { name: "Peugeot 2008 1.6 BlueHDi (100cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "3008",
        years: ["2017-2023", "2009-2016"],
        versions: {
          "2017-2023": [
            { name: "Peugeot 3008 1.5 BlueHDi (130cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Peugeot 3008 Hybrid PHEV (225cv)", type: "hybrid", autonomyRange: 800 }
          ],
          "2009-2016": [
            { name: "Peugeot 3008 1.6 HDi (112cv/115cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      }
    ]
  },
  {
    brand: "Renault",
    models: [
      {
        name: "Clio",
        years: ["2019-Presente (Clio V)", "2012-2018 (Clio IV)", "2005-2012 (Clio III)"],
        versions: {
          "2019-Presente (Clio V)": [
            { name: "Renault Clio 1.0 TCe (90cv)", type: "gasoline", autonomyRange: 720 },
            { name: "Renault Clio E-Tech Hybrid (140cv)", type: "hybrid", autonomyRange: 850 }
          ],
          "2012-2018 (Clio IV)": [
            { name: "Renault Clio 1.5 dCi (90cv) Diesel", type: "diesel", autonomyRange: 950 },
            { name: "Renault Clio 0.9 TCe (90cv)", type: "gasoline", autonomyRange: 680 }
          ],
          "2005-2012 (Clio III)": [
            { name: "Renault Clio 1.5 dCi (70cv/85cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      },
      {
        name: "Megane",
        years: ["2016-Presente", "2008-2015", "2002-2008"],
        versions: {
          "2016-Presente": [
            { name: "Renault Megane 1.5 Blue dCi (115cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Renault Megane E-Tech EV60 Elétrico", type: "electric", autonomyRange: 450 }
          ],
          "2008-2015": [
            { name: "Renault Megane 1.5 dCi (90cv/110cv)", type: "diesel", autonomyRange: 980 }
          ],
          "2002-2008": [
            { name: "Renault Megane 1.5 dCi (80cv/105cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      },
      {
        name: "Captur",
        years: ["2020-Presente", "2013-2019"],
        versions: {
          "2020-Presente": [
            { name: "Renault Captur 1.6 E-Tech HEV Híbrido", type: "hybrid", autonomyRange: 880 },
            { name: "Renault Captur 1.5 Blue dCi (95cv/115cv)", type: "diesel", autonomyRange: 1000 }
          ],
          "2013-2019": [
            { name: "Renault Captur 1.5 dCi (90cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "Zoe",
        years: ["2019-2024", "2012-2018"],
        versions: {
          "2019-2024": [
            { name: "Renault Zoe R135 Elétrico (52 kWh)", type: "electric", autonomyRange: 395 }
          ],
          "2012-2018": [
            { name: "Renault Zoe Q90 Elétrico (41 kWh)", type: "electric", autonomyRange: 300 }
          ]
        }
      }
    ]
  },
  {
    brand: "SEAT",
    models: [
      {
        name: "Leon",
        years: ["2020-Presente", "2013-2019", "2005-2012"],
        versions: {
          "2020-Presente": [
            { name: "SEAT Leon 2.0 TDI (150cv)", type: "diesel", autonomyRange: 1050 },
            { name: "SEAT Leon 1.5 eTSI MHEV (150cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2013-2019": [
            { name: "SEAT Leon 1.6 TDI (110cv/115cv)", type: "diesel", autonomyRange: 1050 },
            { name: "SEAT Leon 1.4 TSI (125cv)", type: "gasoline", autonomyRange: 780 }
          ],
          "2005-2012": [
            { name: "SEAT Leon 1.9 TDI (105cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      },
      {
        name: "Ibiza",
        years: ["2017-Presente", "2008-2016", "2002-2007"],
        versions: {
          "2017-Presente": [
            { name: "SEAT Ibiza 1.0 TSI (95cv/110cv)", type: "gasoline", autonomyRange: 720 },
            { name: "SEAT Ibiza 1.6 TDI (95cv)", type: "diesel", autonomyRange: 920 }
          ],
          "2008-2016": [
            { name: "SEAT Ibiza 1.6 TDI (105cv)", type: "diesel", autonomyRange: 950 }
          ],
          "2002-2007": [
            { name: "SEAT Ibiza 1.9 TDI (100cv/130cv)", type: "diesel", autonomyRange: 980 }
          ]
        }
      },
      {
        name: "Arona",
        years: ["2017-Presente"],
        versions: {
          "2017-Presente": [
            { name: "SEAT Arona 1.0 TSI (95cv/110cv)", type: "gasoline", autonomyRange: 720 },
            { name: "SEAT Arona 1.6 TDI Diesel (95cv)", type: "diesel", autonomyRange: 1000 }
          ]
        }
      }
    ]
  },
  {
    brand: "Skoda",
    models: [
      {
        name: "Fabia",
        years: ["2021-Presente", "2015-2020", "2007-2014"],
        versions: {
          "2021-Presente": [
            { name: "Skoda Fabia 1.0 TSI (95cv/110cv)", type: "gasoline", autonomyRange: 750 }
          ],
          "2015-2020": [
            { name: "Skoda Fabia 1.4 TDI Diesel (90cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Skoda Fabia 1.2 TSI (90cv)", type: "gasoline", autonomyRange: 740 }
          ],
          "2007-2014": [
            { name: "Skoda Fabia 1.6 TDI Diesel (90cv/105cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      },
      {
        name: "Octavia",
        years: ["2020-Presente", "2013-2019", "2004-2012"],
        versions: {
          "2020-Presente": [
            { name: "Skoda Octavia 2.0 TDI (116cv/150cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Skoda Octavia iV PHEV Híbrido (204cv)", type: "hybrid", autonomyRange: 850 }
          ],
          "2013-2019": [
            { name: "Skoda Octavia 1.6 TDI Diesel (105cv/110cv/115cv)", type: "diesel", autonomyRange: 1150 }
          ],
          "2004-2012": [
            { name: "Skoda Octavia 1.9 TDI (105cv)", type: "diesel", autonomyRange: 1080 }
          ]
        }
      }
    ]
  },
  {
    brand: "Tesla",
    models: [
      {
        name: "Model 3",
        years: ["2024-Presente (Highland)", "2019-2023"],
        versions: {
          "2024-Presente (Highland)": [
            { name: "Tesla Model 3 RWD Elétrico (60 kWh)", type: "electric", autonomyRange: 513 },
            { name: "Tesla Model 3 Long Range AWD (75 kWh)", type: "electric", autonomyRange: 629 }
          ],
          "2019-2023": [
            { name: "Tesla Model 3 Standard Range Plus (55 kWh)", type: "electric", autonomyRange: 409 },
            { name: "Tesla Model 3 Long Range AWD (75 kWh)", type: "electric", autonomyRange: 560 }
          ]
        }
      },
      {
        name: "Model Y",
        years: ["2021-Presente"],
        versions: {
          "2021-Presente": [
            { name: "Tesla Model Y RWD Elétrico (60 kWh)", type: "electric", autonomyRange: 455 },
            { name: "Tesla Model Y Long Range AWD (75 kWh)", type: "electric", autonomyRange: 533 }
          ]
        }
      },
      {
        name: "Model S",
        years: ["2021-Presente", "2013-2020"],
        versions: {
          "2021-Presente": [
            { name: "Tesla Model S Dual Motor Elétrico (100 kWh)", type: "electric", autonomyRange: 634 },
            { name: "Tesla Model S Plaid Elétrico (100 kWh)", type: "electric", autonomyRange: 600 }
          ],
          "2013-2020": [
            { name: "Tesla Model S 75D Elétrico (75 kWh)", type: "electric", autonomyRange: 380 },
            { name: "Tesla Model S 100D Elétrico (100 kWh)", type: "electric", autonomyRange: 500 }
          ]
        }
      }
    ]
  },
  {
    brand: "Toyota",
    models: [
      {
        name: "Yaris",
        years: ["2020-Presente", "2011-2019", "2005-2010"],
        versions: {
          "2020-Presente": [
            { name: "Toyota Yaris 1.5 Hybrid (116cv) [Aconselhado]", type: "hybrid", autonomyRange: 850 }
          ],
          "2011-2019": [
            { name: "Toyota Yaris 1.5 Hybrid (100cv)", type: "hybrid", autonomyRange: 800 },
            { name: "Toyota Yaris 1.4 D-4D Diesel (90cv)", type: "diesel", autonomyRange: 950 }
          ],
          "2005-2010": [
            { name: "Toyota Yaris 1.4 D-4D (90cv)", type: "diesel", autonomyRange: 980 }
          ]
        }
      },
      {
        name: "Auris",
        years: ["2013-2018", "2007-2012"],
        versions: {
          "2013-2018": [
            { name: "Toyota Auris 1.8 Hybrid (136cv)", type: "hybrid", autonomyRange: 800 },
            { name: "Toyota Auris 1.4 D-4D Diesel (90cv)", type: "diesel", autonomyRange: 1000 }
          ],
          "2007-2012": [
            { name: "Toyota Auris 1.4 D-4D (90cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      },
      {
        name: "Corolla",
        years: ["2019-Presente", "2002-2007"],
        versions: {
          "2019-Presente": [
            { name: "Toyota Corolla 1.8 Hybrid (122cv/140cv)", type: "hybrid", autonomyRange: 850 },
            { name: "Toyota Corolla 2.0 Hybrid (180cv/196cv)", type: "hybrid", autonomyRange: 800 }
          ],
          "2002-2007": [
            { name: "Toyota Corolla 1.4 D-4D (90cv)", type: "diesel", autonomyRange: 980 }
          ]
        }
      }
    ]
  },
  {
    brand: "Volkswagen",
    models: [
      {
        name: "Golf",
        years: ["2020-Presente (Golf VIII)", "2013-2019 (Golf VII)", "2003-2008 (Golf V)"],
        versions: {
          "2020-Presente (Golf VIII)": [
            { name: "Volkswagen Golf VIII 2.0 TDI (150cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Volkswagen Golf VIII 1.5 eTSI MHEV (150cv)", type: "hybrid", autonomyRange: 820 }
          ],
          "2013-2019 (Golf VII)": [
            { name: "Volkswagen Golf VII 1.6 TDI (105cv/115cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Volkswagen Golf VII 1.4 GTE PHEV (204cv)", type: "hybrid", autonomyRange: 800 }
          ],
          "2003-2008 (Golf V)": [
            { name: "Volkswagen Golf V 1.9 TDI (105cv)", type: "diesel", autonomyRange: 1050 }
          ]
        }
      },
      {
        name: "Polo",
        years: ["2017-Presente", "2009-2016", "2005-2009"],
        versions: {
          "2017-Presente": [
            { name: "Volkswagen Polo 1.0 TSI (95cv/110cv)", type: "gasoline", autonomyRange: 720 },
            { name: "Volkswagen Polo 1.6 TDI Diesel (95cv)", type: "diesel", autonomyRange: 950 }
          ],
          "2009-2016": [
            { name: "Volkswagen Polo 1.2 TDI BlueMotion (75cv)", type: "diesel", autonomyRange: 1100 },
            { name: "Volkswagen Polo 1.6 TDI (90cv)", type: "diesel", autonomyRange: 1000 }
          ],
          "2005-2009": [
            { name: "Volkswagen Polo 1.4 TDI (70cv/80cv)", type: "diesel", autonomyRange: 1020 }
          ]
        }
      },
      {
        name: "T-Roc",
        years: ["2017-Presente (Made in Portugal)"],
        versions: {
          "2017-Presente (Made in Portugal)": [
            { name: "Volkswagen T-Roc 1.0 TSI (110cv/115cv)", type: "gasoline", autonomyRange: 780 },
            { name: "Volkswagen T-Roc 1.6 TDI Diesel (115cv)", type: "diesel", autonomyRange: 1050 },
            { name: "Volkswagen T-Roc 2.0 TDI (150cv)", type: "diesel", autonomyRange: 1100 }
          ]
        }
      },
      {
        name: "Passat",
        years: ["2015-2023 (B8)", "2010-2014 (B7)"],
        versions: {
          "2015-2023 (B8)": [
            { name: "Volkswagen Passat 2.0 TDI (150cv) Diesel", type: "diesel", autonomyRange: 1200 },
            { name: "Volkswagen Passat GTE PHEV (218cv) Híbrido", type: "hybrid", autonomyRange: 900 }
          ],
          "2010-2014 (B7)": [
            { name: "Volkswagen Passat 1.6 TDI Diesel (105cv)", type: "diesel", autonomyRange: 1250 },
            { name: "Volkswagen Passat 2.0 TDI (140cv/177cv)", type: "diesel", autonomyRange: 1150 }
          ]
        }
      }
    ]
  },
  {
    brand: "Volvo",
    models: [
      {
        name: "V40",
        years: ["2016-2019", "2012-2015"],
        versions: {
          "2016-2019": [
            { name: "Volvo V40 D2 2.0 (120cv) Diesel", type: "diesel", autonomyRange: 1150 },
            { name: "Volvo V40 D3 2.0 (150cv)", type: "diesel", autonomyRange: 1100 }
          ],
          "2012-2015": [
            { name: "Volvo V40 D2 1.6 (115cv)", type: "diesel", autonomyRange: 1250 }
          ]
        }
      },
      {
        name: "XC40",
        years: ["2018-Presente"],
        versions: {
          "2018-Presente": [
            { name: "Volvo XC40 D3 Diesel (150cv)", type: "diesel", autonomyRange: 1000 },
            { name: "Volvo XC40 Recharge PHEV (211cv)", type: "hybrid", autonomyRange: 820 },
            { name: "Volvo EX40 Recharge EV Elétrico (69 kWh)", type: "electric", autonomyRange: 425 }
          ]
        }
      }
    ]
  }
];

export const ALL_BRANDS = POPULAR_BRANDS.map(b => b.brand).sort();

export function getModelsForBrand(brand: string): string[] {
  const brandData = POPULAR_BRANDS.find(b => b.brand.toLowerCase() === brand.toLowerCase());
  return brandData ? brandData.models.map(m => m.name) : [];
}

export function getYearsForModel(brand: string, model: string): string[] {
  const brandData = POPULAR_BRANDS.find(b => b.brand.toLowerCase() === brand.toLowerCase());
  if (!brandData) return [];
  const modelData = brandData.models.find(m => m.name.toLowerCase() === model.toLowerCase());
  return modelData ? modelData.years : [];
}

export function getVersionsForSelection(brand: string, model: string, yearRange: string): CarEngineVersion[] {
  const brandData = POPULAR_BRANDS.find(b => b.brand.toLowerCase() === brand.toLowerCase());
  if (!brandData) return [];
  const modelData = brandData.models.find(m => m.name.toLowerCase() === model.toLowerCase());
  if (!modelData) return [];
  const range = yearRange || modelData.years[0];
  return modelData.versions[range] || [];
}
