/**
 * Quais foros pertencem a cada comarca do TJSP.
 *
 * Chave: id da comarca (`cmb_comarca1_ativa_alocacao`).
 * Valor: ids de foro (`cmb_foro1_ativo_alocacao`), que existem em
 * `forosTJSP.ts` — os rótulos moram lá, não aqui.
 *
 * Colhido do portal em 13/08/2026 por `scripts/gen-foros-por-comarca.mjs`,
 * percorrendo as 321 comarcas uma a uma.
 *
 * Existe para o painel oferecer SÓ os foros da comarca escolhida. Sem isso a
 * lista mostrava os 524 foros do estado inteiro, e nada impedia
 * escolher um foro de outra cidade: a extensão não acharia a opção na página e
 * a guia sairia sem foro.
 *
 * 321 comarcas, 459 pares. A maioria tem um único foro;
 * São Paulo tem 54.
 */
export const FOROS_POR_COMARCA: Readonly<Record<string, readonly string[]>> = {
  // Adamantina
  '5594': ['5595'],
  // Aguaí
  '5611': ['5612'],
  // Águas de Lindóia
  '5619': ['5620'],
  // Agudos
  '5627': ['5628'],
  // Altinópolis
  '5637': ['5638'],
  // Americana
  '5645': ['5646', '5673'],
  // Américo Brasiliense
  '1232270': ['1232271'],
  // Amparo
  '5676': ['5677', '5692'],
  // Andradina
  '5695': ['5696', '5713'],
  // Angatuba
  '5716': ['5717'],
  // Aparecida
  '5722': ['5723'],
  // Apiaí
  '5735': ['5736'],
  // Araçatuba
  '5743': ['5783', '5744', '5786', '1254100', '1252900'],
  // Araraquara
  '5789': ['5790', '5840'],
  // Araras
  '5843': ['5844'],
  // Artur Nogueira
  '1232280': ['1232281'],
  // Arujá
  '1232300': ['1232301'],
  // Assis
  '5859': ['5860', '5891'],
  // Atibaia
  '5894': ['5895'],
  // Auriflama
  '5928': ['5929'],
  // Avaré
  '5938': ['5939', '5962'],
  // Bananal
  '5965': ['5966'],
  // Bariri
  '5973': ['5974'],
  // Barra Bonita
  '5983': ['5984'],
  // Barretos
  '5995': ['5996', '6025'],
  // Barueri
  '6028': ['6029'],
  // Bastos
  '1232314': ['1232315'],
  // Batatais
  '6067': ['6068', '6084'],
  // Bauru
  '6087': ['6088', '6091', '6142', '1254900'],
  // Bebedouro
  '6145': ['6146'],
  // Bertioga
  '1232320': ['1232321'],
  // Bilac
  '6161': ['6162'],
  // Birigui
  '6167': ['6168'],
  // Boituva
  '6185': ['6186'],
  // Borborema
  '6199': ['6200'],
  // Botucatu
  '6207': ['6208', '6234'],
  // Bragança Paulista
  '6237': ['6238', '6266'],
  // Brodowski
  '6269': ['6270'],
  // Brotas
  '6279': ['6280'],
  // Buri
  '1232328': ['1232329'],
  // Buritama
  '6285': ['6286'],
  // Cabreúva
  '6297': ['6298'],
  // Caçapava
  '6303': ['6304'],
  // Cachoeira Paulista
  '6315': ['6316'],
  // Caconde
  '6323': ['6324'],
  // Cafelândia
  '6333': ['6334'],
  // Caieiras
  '1232332': ['1232333'],
  // Cajamar
  '1232342': ['1232343'],
  // Cajuru
  '6341': ['6342'],
  // Campinas
  '6347': ['6448', '6359', '1249817', '6451', '6348', '1260100'],
  // Campo Limpo Paulista
  '1232354': ['1232355'],
  // Campos do Jordão
  '6454': ['6455'],
  // Cananéia
  '6464': ['6465'],
  // Cândido Mota
  '6470': ['6471'],
  // Capão Bonito
  '6480': ['6481'],
  // Capivari
  '6492': ['6493'],
  // Caraguatatuba
  '6500': ['6501', '6518'],
  // Carapicuíba
  '6521': ['6522'],
  // Cardoso
  '6541': ['6542'],
  // Casa Branca
  '6549': ['6550', '6561'],
  // Catanduva
  '6564': ['6565', '6584'],
  // Cerqueira César
  '6592': ['6593'],
  // Cerquilho
  '6602': ['6603'],
  // Cesário Lange
  '1240704': ['1240705'],
  // Chavantes
  '6610': ['6611'],
  // Colina
  '6618': ['6619'],
  // Conchal
  '1232366': ['1232367'],
  // Conchas
  '6624': ['6625'],
  // Cordeirópolis
  '6632': ['6633'],
  // Cosmópolis
  '6638': ['6639'],
  // Cotia
  '6642': ['6643'],
  // Cravinhos
  '6658': ['6659'],
  // Cruzeiro
  '6668': ['6669'],
  // Cubatão
  '6680': ['6681'],
  // Cunha
  '6696': ['6697'],
  // Descalvado
  '6702': ['6703'],
  // Diadema
  '6710': ['6711'],
  // Dois Córregos
  '6736': ['6737'],
  // Dracena
  '6742': ['6743', '6756'],
  // Duartina
  '6759': ['6760'],
  // Eldorado
  '6767': ['6768'],
  // Embu das Artes
  '6775': ['6776'],
  // Embu-Guaçu
  '1232376': ['1232377'],
  // Espírito Santo do Pinhal
  '6791': ['6792'],
  // Estrela D'Oeste
  '6801': ['6802'],
  // Fartura
  '6809': ['6810'],
  // Fernandópolis
  '6817': ['6818', '6839'],
  // Ferraz de Vasconcelos
  '1232382': ['1232383'],
  // Flórida Paulista
  '1232396': ['1232397'],
  // Franca
  '6851': ['6852', '6889'],
  // Francisco Morato
  '6892': ['6893'],
  // Franco da Rocha
  '6904': ['6914'],
  // Gália
  '6927': ['6928'],
  // Garça
  '6933': ['6934'],
  // General Salgado
  '6945': ['6946'],
  // Getulina
  '6953': ['6954'],
  // Guaíra
  '6961': ['6962'],
  // Guará
  '6971': ['6972'],
  // Guararapes
  '6979': ['6980'],
  // Guararema
  '1232400': ['1232401'],
  // Guaratinguetá
  '6989': ['6990', '7007'],
  // Guariba
  '7010': ['7011'],
  // Guarujá
  '7020': ['7032', '7021'],
  // Guarulhos
  '7057': ['7058', '7143', '1259918'],
  // Hortolândia
  '1232420': ['1232421'],
  // Iacanga
  '1232432': ['1232433'],
  // Ibaté
  '1232444': ['1232445'],
  // Ibitinga
  '7146': ['7150'],
  // Ibiúna
  '7167': ['7168'],
  // Iepê
  '1232454': ['1232455'],
  // Igarapava
  '7179': ['7180'],
  // Iguape
  '7189': ['7190'],
  // Ilha Solteira
  '7203': ['7204'],
  // Ilhabela
  '1232462': ['1232463'],
  // Indaiatuba
  '7213': ['7214'],
  // Ipaussu
  '7231': ['7232'],
  // Ipuã
  '7237': ['7238'],
  // Itaberá
  '1232474': ['1232475'],
  // Itaí
  '7247': ['7248'],
  // Itajobi
  '1232492': ['1232493'],
  // Itanhaém
  '7253': ['7254', '7280'],
  // Itapecerica da Serra
  '7283': ['7289', '7308'],
  // Itapetininga
  '7311': ['7312', '7341'],
  // Itapeva
  '7344': ['7352', '7369'],
  // Itapevi
  '7375': ['7376'],
  // Itapira
  '7390': ['7391'],
  // Itápolis
  '7404': ['7405'],
  // Itaporanga
  '7416': ['7417'],
  // Itaquaquecetuba
  '7424': ['7425'],
  // Itararé
  '7442': ['7443'],
  // Itariri
  '1232498': ['1232499'],
  // Itatiba
  '7452': ['7453'],
  // Itatinga
  '1232506': ['1232507'],
  // Itirapina
  '1232290': ['1232291'],
  // Itu
  '7469': ['7470', '7497'],
  // Itupeva
  '1232296': ['1232297'],
  // Ituverava
  '7500': ['7501', '7512'],
  // Jaboticabal
  '7515': ['7516', '7531'],
  // Jacareí
  '7534': ['7535'],
  // Jacupiranga
  '7554': ['7555'],
  // Jaguariúna
  '7569': ['7570'],
  // Jales
  '7579': ['7580', '7601'],
  // Jandira
  '1232408': ['1232409'],
  // Jardinópolis
  '7604': ['7605'],
  // Jarinu
  '1232438': ['1232439'],
  // Jaú
  '7614': ['7615', '7640'],
  // José Bonifácio
  '7643': ['7644'],
  // Jundiaí / SP
  '7657': ['7678', '7724'],
  // Junqueirópolis
  '7727': ['7728'],
  // Juquiá
  '7735': ['7736'],
  // Laranjal Paulista
  '7741': ['7742'],
  // Leme
  '7749': ['7750'],
  // Lençóis Paulista
  '7765': ['7766'],
  // Limeira
  '7779': ['7780', '7811'],
  // Lins
  '7814': ['7815', '7834'],
  // Lorena
  '7837': ['7838'],
  // Louveira
  '1232448': ['1232449'],
  // Lucélia
  '7858': ['7859'],
  // Macatuba
  '7866': ['7867'],
  // Macaubal
  '1232468': ['1232469'],
  // Mairinque
  '7872': ['7873'],
  // Mairiporã
  '7882': ['7883'],
  // Maracaí
  '7894': ['7895'],
  // Marília
  '7904': ['7905', '7942'],
  // Martinópolis
  '7945': ['7946'],
  // Matão
  '7953': ['7954'],
  // Mauá
  '7969': ['7970'],
  // Miguelópolis
  '7991': ['7992'],
  // Miracatu
  '7999': ['8000'],
  // Mirandópolis
  '8007': ['8008'],
  // Mirante do Paranapanema
  '8020': ['8021'],
  // Mirassol
  '8026': ['8027'],
  // Mococa
  '8045': ['8046'],
  // Mogi das Cruzes
  '8055': ['8056', '8063', '8104'],
  // Mogi-Guaçu
  '8107': ['8108'],
  // Mogi-Mirim
  '8123': ['8131', '8146'],
  // Mongaguá
  '8156': ['8157'],
  // Monte Alto
  '8168': ['8169'],
  // Monte Aprazível
  '8187': ['8193'],
  // Monte Azul Paulista
  '8202': ['8203'],
  // Monte Mor
  '8208': ['8209'],
  // Morro Agudo
  '8220': ['8221'],
  // Nazaré Paulista
  '1232482': ['1232483'],
  // Neves Paulista
  '1232512': ['1232513'],
  // Nhandeara
  '8228': ['8229'],
  // Nova Granada
  '8234': ['8235'],
  // Nova Odessa
  '8244': ['8245'],
  // Novo Horizonte
  '8256': ['8262'],
  // Nuporanga
  '8273': ['8274'],
  // Olímpia
  '8281': ['8282'],
  // Orlândia
  '8297': ['8298'],
  // Osasco
  '8309': ['8310', '8365', '1259921'],
  // Osvaldo Cruz
  '8368': ['8369'],
  // Ourinhos
  '8378': ['8379', '8398'],
  // Ouroeste
  '1232518': ['1232519'],
  // Pacaembu
  '8401': ['8402'],
  // Palestina
  '8409': ['8410'],
  // Palmeira D'Oeste
  '8415': ['8416'],
  // Palmital
  '8425': ['8426'],
  // Panorama
  '8437': ['8438'],
  // Paraguaçu Paulista
  '8449': ['8450'],
  // Paraibuna
  '8463': ['8464'],
  // Paranapanema
  '1232528': ['1232529'],
  // Pariquera-Açu
  '1232536': ['1232537'],
  // Patrocínio Paulista
  '8469': ['8470'],
  // Paulínia
  '1232542': ['1232543'],
  // Paulo de Faria
  '8477': ['8478'],
  // Pederneiras
  '8483': ['8484'],
  // Pedregulho
  '8493': ['8494'],
  // Pedreira
  '8499': ['8500'],
  // Penápolis
  '8509': ['8510'],
  // Pereira Barreto
  '8527': ['8528'],
  // Peruíbe
  '8539': ['8540'],
  // Piedade
  '8551': ['8552'],
  // Pilar do Sul
  '8561': ['8562'],
  // Pindamonhangaba
  '8569': ['8570'],
  // Pinhalzinho
  '1232554': ['1232555'],
  // Piquete
  '1232560': ['1232561'],
  // Piracaia
  '8585': ['8586'],
  // Piracicaba
  '8595': ['8596', '8648', '1260005'],
  // Piraju
  '8651': ['8652'],
  // Pirajuí
  '8663': ['8664'],
  // Pirangi
  '1232564': ['1232565'],
  // Pirapozinho
  '8673': ['8674'],
  // Pirassununga
  '8683': ['8684', '8699'],
  // Piratininga
  '8702': ['8703'],
  // Pitangueiras
  '8706': ['8707'],
  // Poá
  '8716': ['8730'],
  // Pompéia
  '8743': ['8744'],
  // Pontal
  '8749': ['8750'],
  // Porangaba
  '8757': ['8758'],
  // Porto Feliz
  '8765': ['8766'],
  // Porto Ferreira
  '8775': ['8776'],
  // Potirendaba
  '8787': ['8788'],
  // Praia Grande
  '8793': ['8794'],
  // Presidente Bernardes
  '8815': ['8816'],
  // Presidente Epitácio
  '8823': ['8824'],
  // Presidente Prudente
  '8833': ['8834', '8879', '1256603', '8882'],
  // Presidente Venceslau
  '8885': ['8886', '8901'],
  // Promissão
  '8904': ['8905'],
  // Quatá
  '8914': ['8915'],
  // Queluz
  '8924': ['8925'],
  // Rancharia
  '8934': ['8942'],
  // Regente Feijó
  '8951': ['8952'],
  // Registro
  '8963': ['8964', '8979'],
  // Ribeirão Bonito
  '8982': ['8983'],
  // Ribeirão Pires
  '8988': ['8989'],
  // Ribeirão Preto
  '9007': ['9011', '1250713', '9088', '1255201', '9008'],
  // Rio Claro
  '9091': ['9097', '9130'],
  // Rio das Pedras
  '1232570': ['1232571'],
  // Rio Grande da Serra
  '1232578': ['1232579'],
  // Rosana
  '9133': ['9134'],
  // Roseira
  '1232584': ['1232585'],
  // Salesópolis
  '1232588': ['1232589'],
  // Salto
  '9139': ['9140'],
  // Salto de Pirapora
  '1232594': ['1232595'],
  // Santa Adélia
  '9157': ['9158'],
  // Santa Bárbara d'Oeste
  '9165': ['9166'],
  // Santa Branca
  '9186': ['9190'],
  // Santa Cruz das Palmeiras
  '9197': ['9198'],
  // Santa Cruz do Rio Pardo
  '9205': ['9206'],
  // Santa Fé do Sul
  '9219': ['9220'],
  // Santa Isabel
  '9233': ['9245'],
  // Santa Rita do Passa Quatro
  '9256': ['9257'],
  // Santa Rosa de Viterbo
  '9264': ['9265'],
  // Santana de Parnaíba
  '9270': ['9271'],
  // Santo Anastácio
  '9280': ['9281'],
  // Santo André
  '9288': ['9292', '9289'],
  // Santos
  '9355': ['9367', '9364', '1253300', '1251006', '9361'],
  // São Bento do Sapucaí
  '9454': ['9455'],
  // São Bernardo do Campo
  '9460': ['9464', '9461'],
  // São Caetano do Sul
  '9521': ['9522'],
  // São Carlos
  '9545': ['9552', '9549'],
  // São João da Boa Vista
  '9581': ['9582', '9601'],
  // São Joaquim da Barra
  '9604': ['9605'],
  // São José do Rio Pardo
  '9616': ['9617'],
  // São José do Rio Preto
  '9631': ['9638', '1250308', '9635', '1255401', '9632'],
  // São José dos Campos
  '9691': ['9695', '9758', '1254103', '9692'],
  // São Luiz do Paraitinga
  '9761': ['9762'],
  // São Manuel
  '9769': ['9770'],
  // São Miguel Arcanjo
  '9781': ['9782'],
  // SÃO PAULO
  '9787': ['10712', '1241202', '1254106', '1256003', '1256006', '1256300', '1256303', '1256306', '1255303', '1255307', '1255310', '1255606', '1255609', '1255612', '1255615', '1256000', '10446', '10525', '10431', '10240', '10191', '1243505', '10741', '10177', '10522', '1261501', '10180', '1243700', '1240708', '10715', '9788', '9853', '9927', '9952', '10111', '9989', '10020', '10055', '10088', '10132', '10147', '10222', '10727', '10722', '1259849', '1252200', '1257400', '1252914', '1252911', '1252908', '1257306', '1247310', '10237', '10234'],
  // São Pedro
  '10744': ['10745'],
  // São Roque
  '10756': ['10757'],
  // São Sebastião
  '10770': ['10776'],
  // São Sebastião da Grama
  '1232600': ['1232601'],
  // São Simão
  '10789': ['10790'],
  // São Vicente
  '10799': ['10800'],
  // Serra Negra
  '10829': ['10830'],
  // Serrana
  '10839': ['10840'],
  // Sertãozinho
  '10847': ['10848'],
  // Socorro
  '10868': ['10869'],
  // Sorocaba
  '10878': ['10885', '10882', '1252617', '10879'],
  // Sumaré
  '10953': ['10965'],
  // Suzano
  '10980': ['10981'],
  // Tabapuã
  '1232606': ['1232607'],
  // Taboão da Serra
  '11002': ['11003'],
  // Tambaú
  '11014': ['11015'],
  // Tanabi
  '11020': ['11021'],
  // Taquaritinga
  '11034': ['11035'],
  // Taquarituba
  '11048': ['11049'],
  // Tatuí
  '11056': ['11057'],
  // Taubaté
  '11074': ['11078', '11075'],
  // Teodoro Sampaio
  '11115': ['11116'],
  // Tietê
  '11121': ['11122'],
  // Tremembé
  '11131': ['11132'],
  // Tupã
  '11143': ['11152', '11149'],
  // Tupi Paulista
  '11176': ['11177'],
  // Ubatuba
  '11184': ['11185'],
  // UDAJ de Natividade da Serra
  '1241900': ['1241901'],
  // Urânia
  '11198': ['11199'],
  // Urupês
  '11206': ['11207'],
  // Valinhos
  '11212': ['11213'],
  // Valparaíso
  '11226': ['11227'],
  // Vargem Grande do Sul
  '11234': ['11235'],
  // Vargem Grande Paulista
  '1232612': ['1232613'],
  // Várzea Paulista
  '11244': ['11245'],
  // Vinhedo
  '11258': ['11259'],
  // Viradouro
  '11273': ['11274'],
  // Votorantim
  '11279': ['11280'],
  // Votuporanga
  '11289': ['11293', '11290'],
};
