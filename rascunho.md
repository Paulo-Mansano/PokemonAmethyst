// A conta de acesso do usuário
Classe Usuario {
    String id;
    String email;
    String senhaHash;
    boolean isMestre; // Flag simples para liberar as ferramentas de Mestre
    
    PerfilJogador perfilJogador; // Ficha do jogador associada à conta (pode ser nulo se ele for só mestre)
}

Classe PerfilJogador {
    String id;
    String nomePersonagem;
    ClasseJogador classe; // Enum: CIVIL, TREINADOR, COMPETIDOR, CACADOR, MEDICO, PESQUISADOR
    
    // Economia
    int pokedolares;
    
    // Status do Jogador
    int nivel;
    int xpAtual;
    int xpProximoNivel = nivel*10;
    int hpMaximo;
    int hpAtual;
    int staminaMaxima;
    int staminaAtual;
    int habilidade; // Pontos de habilidade do player
    
    // Atributos base
    Atributos atributos;
    
    // Relações
    List<Pokemon> timePrincipal; // Limitado a 6 na lógica de negócio
    List<Pokemon> boxPc;
    Mochila mochila;
}

Classe Atributos {
    int forca;
    int speed;
    int inteligencia;
    int tecnica;
    int sabedoria;
    int percepcao;
    int dominio;
    int respeito;
}

Classe Pokemon {
    String id;
    int pokedexId;
    String especie;
    String apelido;
    String imagemUrl; 
    String notas;
    
    // Características
    Genero genero; // Enum: MACHO, FEMEA, SEM_GENERO
    boolean isShiny;
    Tipagem tipoPrimario; // Enum: FOGO, AGUA, PLANTA...
    Tipagem tipoSecundario; // Pode ser nulo
    Personalidade personalidade; // Enum: Vamos fazer isso ainda
    Especializacao especializacao; // Enum: VELOCISTA, ATACANTE_FISICO, TANQUE...
    String berryFavorita;
    int nivelDeVinculo;
    
    // Status do Jogo
    int nivel;
    int xpAtual;
    int xpParaOProximoNivel = nivel*10;
    Pokebola pokebolaCaptura; // Enum ou Objeto: POKEBBALL, GREATBALL...
    Item itemSegurado; // Pode ser nulo
    
    // Status de Combate
    int hpMaximo;
    int hpAtual;
    int hpTemporario;
    int staminaMaxima;
    int staminaAtual;
    int staminaTemporaria;
    
    int ataque;
    int ataqueEspecial;
    int defesa;
    int defesaEspecial;
    int speed;
    int tecnica;
    int respeito;
    
    // Condições e Kits
    List<CondicaoStatus> statusAtuais; // Enum: PARALISADO, ENVENENADO, DORMINDO, QUEIMADO (Pode estar vazia)
    List<Habilidade> habilidades;
    List<Movimento> movimentosConhecidos;
}

Classe Movimento {
    String id;
    String nome;
    Tipagem tipo; // Enum
    CategoriaMovimento categoria; // Enum: FISICO, ESPECIAL, STATUS
    int custoStamina;
    String dadoDeDano; // Exemplo: "1d8 + 2"
    String descricaoEfeito; // Aqui fica se é single target, se tem efeito secundário, etc.
}

Classe Habilidade {
    String id;
    String nome;
    String descricao;
}

Classe Mochila {
    String id;
    double pesoMaximo;
    
    // Um mapa/dicionário que liga o Item à Quantidade que o jogador possui
    Map<Item, Integer> conteudos; 
}

Classe Item {
    String id;
    String nome;
    String descricao;
    double peso;
    int preco;
}