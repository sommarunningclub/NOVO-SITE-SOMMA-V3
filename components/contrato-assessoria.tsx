// Conteúdo do Contrato de Prestação de Serviços da Assessoria Somma Club.
// Reutilizado na página /contrato e no modal do checkout.
export function ContratoAssessoria() {
  return (
    <article className="space-y-4 text-[15px] leading-relaxed text-ink/90">
      <header>
        <h1 className="text-2xl font-bold text-ink">Contrato de Prestação de Serviços</h1>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Assessoria Somma Club</p>
      </header>

      <div className="rounded-2xl bg-light p-4 text-sm">
        <p className="font-semibold text-ink">CONTRATADA</p>
        <p className="mt-1">
          SOMMA EMPREENDIMENTOS ESPORTIVOS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ
          sob o nº 61.315.987/0001-28, com sede no ST de Rádio e TV Sul, Quadra 701, Conjunto L, Bloco
          02, nº 30, Sala 417 Parte K 52, Asa Sul, Brasília/DF, CEP 70.340-906, doravante denominada
          simplesmente SOMMA CLUB.
        </p>
        <p className="mt-2 text-muted">
          As partes têm entre si justo e contratado o presente Contrato de Prestação de Serviços de
          Assessoria Esportiva, regido pelas cláusulas seguintes.
        </p>
      </div>

      <Clause n="1. Objeto">
        <P>1.1. O presente contrato tem como objeto a prestação de serviços de assessoria esportiva, orientação de treinos, acompanhamento esportivo, organização de atividades físicas, experiências esportivas, treinos coletivos, eventos, comunicações técnicas e demais atividades relacionadas à Assessoria Somma Club.</P>
        <P>1.2. Os serviços poderão incluir, conforme o plano contratado, prescrição de treinos, acompanhamento por professor, participação em grupos de comunicação, feedbacks periódicos, treinos presenciais, orientações gerais de corrida, fortalecimento, mobilidade, eventos internos, experiências e benefícios comerciais.</P>
        <P>1.3. O acesso, a gestão, os pagamentos, os comunicados, os check-ins, os feedbacks e demais interações poderão ocorrer por meio de plataforma digital, site, aplicativo, WhatsApp, e-mail, sistema de gestão, ferramenta de pagamento ou qualquer outro canal oficial utilizado pelo SOMMA CLUB.</P>
        <P>1.4. Este contrato regula a relação geral entre as partes e será complementado pelas condições específicas do plano ativo no momento da contratação.</P>
      </Clause>

      <Clause n="2. Adesão e Aceite Digital">
        <P>2.1. A adesão aos serviços poderá ocorrer de forma presencial ou digital, mediante preenchimento de cadastro, contratação de plano, pagamento, aceite eletrônico, assinatura digital ou qualquer outra forma válida de manifestação de vontade.</P>
        <P>2.2. O CONTRATANTE reconhece que o aceite eletrônico deste contrato possui validade jurídica e produz os mesmos efeitos de uma assinatura física.</P>
        <P>2.3. Ao aceitar este contrato, o CONTRATANTE declara ter lido, compreendido e concordado com todas as condições aqui previstas, bem como com as regras comerciais do plano escolhido.</P>
        <P>2.4. O SOMMA CLUB poderá manter registros eletrônicos de aceite, IP, data, horário, e-mail, telefone, CPF, comprovantes de pagamento e demais informações necessárias para comprovar a contratação.</P>
      </Clause>

      <Clause n="3. Planos, Valores e Benefícios">
        <P>3.1. Os planos, valores, prazos, formas de pagamento, benefícios, descontos e condições comerciais serão apresentados ao CONTRATANTE no momento da contratação.</P>
        <P>3.2. A Assessoria Somma Club poderá oferecer planos mensais, semestrais, anuais, promocionais, corporativos, experimentais ou personalizados, cada um com regras próprias de vigência, pagamento, cancelamento e benefícios.</P>
        <P>3.3. O CONTRATANTE declara ciência de que benefícios financeiros, descontos ou condições especiais podem estar vinculados ao prazo de permanência mínima do plano escolhido.</P>
        <P>3.4. Os benefícios incluídos no plano não são cumulativos com outras promoções, salvo autorização expressa do SOMMA CLUB.</P>
        <P>3.5. O não uso dos serviços, a ausência em treinos, eventos ou atividades, ou a não interação com os canais de atendimento não gera direito automático a desconto, reembolso, abatimento, compensação ou prorrogação do plano.</P>
      </Clause>

      <Clause n="4. Planos com Fidelidade e Recomposição de Benefício">
        <P>4.1. Quando o CONTRATANTE optar por plano com desconto vinculado à permanência mínima, declara ciência de que o desconto concedido está condicionado ao cumprimento integral do período contratado.</P>
        <P>4.2. Em caso de cancelamento antecipado de plano com fidelidade, poderá ser realizado recálculo financeiro com base no valor mensal cheio vigente no momento da adesão.</P>
        <P>4.3. Para fins de recomposição, será considerado o número de meses efetivamente utilizados pelo CONTRATANTE.</P>
        <P>4.4. O CONTRATANTE deverá pagar a diferença entre o valor efetivamente pago e o valor que seria devido caso tivesse contratado o plano mensal sem desconto pelo período utilizado.</P>
        <P>4.5. A cobrança prevista nesta cláusula possui natureza de recomposição de benefício financeiro concedido, não sendo caracterizada como multa punitiva.</P>
        <P>4.6. A recomposição não será aplicada quando o cancelamento ocorrer por culpa exclusiva do SOMMA CLUB ou em hipóteses legalmente reconhecidas que impeçam a continuidade do serviço, desde que devidamente comprovadas.</P>
      </Clause>

      <Clause n="5. Alteração de Plano">
        <P>5.1. O CONTRATANTE poderá solicitar alteração de plano, upgrade ou downgrade, conforme regras operacionais, disponibilidade e condições comerciais vigentes.</P>
        <P>5.2. A alteração de plano poderá gerar novo valor, novo ciclo de pagamento, novo prazo de permanência, novos benefícios e novas condições de cancelamento.</P>
        <P>5.3. Alterações de plano somente serão efetivadas após confirmação do SOMMA CLUB e, quando aplicável, aceite do CONTRATANTE na plataforma ou canal oficial.</P>
        <P>5.4. O SOMMA CLUB poderá negar alterações em caso de inadimplência, inconsistência cadastral, indisponibilidade operacional ou descumprimento contratual.</P>
      </Clause>

      <Clause n="6. Pagamento">
        <P>6.1. O pagamento dos serviços poderá ocorrer por cartão de crédito, boleto, Pix, assinatura recorrente, link de pagamento, plataforma de cobrança ou outro meio disponibilizado pelo SOMMA CLUB.</P>
        <P>6.2. A cobrança poderá ser mensal, semestral, anual, recorrente, parcelada ou à vista, conforme o plano contratado.</P>
        <P>6.3. O CONTRATANTE é responsável por manter seus dados de pagamento atualizados e garantir saldo, limite ou autorização suficiente para a cobrança.</P>
        <P>6.4. Eventuais taxas de intermediação, parcelamento, juros de cartão, tarifas bancárias ou custos operacionais poderão ser repassados ao CONTRATANTE quando informados previamente.</P>
        <P>6.5. A contratação do plano representa compromisso financeiro pelo período e condições escolhidos, independentemente da frequência de utilização dos serviços.</P>
      </Clause>

      <Clause n="7. Inadimplência">
        <P>7.1. O atraso no pagamento poderá implicar multa de 2% sobre o valor devido, juros de 1% ao mês, correção monetária e demais encargos permitidos pela legislação aplicável.</P>
        <P>7.2. Em caso de inadimplência, o SOMMA CLUB poderá suspender o acesso do CONTRATANTE à assessoria, aos treinos, grupos, check-ins, plataforma, eventos, benefícios e demais serviços vinculados ao plano.</P>
        <P>7.3. A suspensão por inadimplência não encerra automaticamente o contrato e não elimina os valores vencidos.</P>
        <P>7.4. O SOMMA CLUB poderá realizar cobrança administrativa ou extrajudicial, encaminhar o débito para empresas especializadas, protestar títulos, negativar o nome do CONTRATANTE, ceder o crédito a terceiros ou adotar outras medidas legalmente permitidas.</P>
        <P>7.5. A regularização do pagamento poderá restabelecer o acesso aos serviços, observadas as regras internas, a disponibilidade e a inexistência de outros descumprimentos contratuais.</P>
      </Clause>

      <Clause n="8. Cancelamento">
        <P>8.1. O cancelamento deverá ser solicitado pelo CONTRATANTE por canal oficial do SOMMA CLUB, como plataforma, e-mail, WhatsApp oficial ou outro meio informado pela CONTRATADA.</P>
        <P>8.2. O cancelamento somente será considerado efetivado após confirmação expressa do SOMMA CLUB e, quando aplicável, assinatura física ou digital de termo de cancelamento.</P>
        <P>8.3. Até a efetiva formalização do cancelamento, permanecem devidos os valores vencidos e as cobranças proporcionais aplicáveis.</P>
        <P>8.4. Em planos com fidelidade, o cancelamento antecipado poderá gerar recomposição de benefício financeiro, nos termos da Cláusula 4.</P>
        <P>8.5. Em planos recorrentes sem fidelidade, o cancelamento interromperá as próximas cobranças, respeitado o ciclo de faturamento já iniciado.</P>
        <P>8.6. Valores já pagos por ciclos em andamento não serão automaticamente reembolsados, salvo previsão específica do plano, falha comprovada na prestação do serviço ou hipótese legal aplicável.</P>
        <P>8.7. Em contratações realizadas exclusivamente pela internet, poderá ser observado o direito de arrependimento dentro do prazo legal, quando aplicável.</P>
      </Clause>

      <Clause n="9. Suspensão Temporária do Plano">
        <P>9.1. A suspensão temporária do plano somente será permitida quando prevista nas condições comerciais do plano contratado ou autorizada expressamente pelo SOMMA CLUB.</P>
        <P>9.2. O SOMMA CLUB poderá estabelecer prazo mínimo, prazo máximo, quantidade de suspensões permitidas, antecedência necessária e documentos exigidos para suspensão.</P>
        <P>9.3. A suspensão não será concedida de forma automática e dependerá de análise operacional.</P>
        <P>9.4. Em caso de lesão, doença, gravidez, viagem ou outro motivo relevante, o CONTRATANTE poderá solicitar análise específica, apresentando documentação comprobatória quando necessário.</P>
      </Clause>

      <Clause n="10. Responsabilidade, Saúde e Aptidão Física">
        <P>10.1. O CONTRATANTE declara estar apto à prática de atividades físicas e esportivas, responsabilizando-se por avaliar previamente suas condições de saúde.</P>
        <P>10.2. O CONTRATANTE reconhece que atividades físicas, corridas, treinos, exercícios, eventos esportivos e experiências ao ar livre envolvem riscos inerentes, incluindo quedas, lesões, mal-estar, fadiga, desidratação, acidentes, contato com terceiros, variações climáticas e outros eventos imprevisíveis.</P>
        <P>10.3. O CONTRATANTE compromete-se a informar ao SOMMA CLUB e ao professor responsável sobre qualquer condição médica, limitação física, lesão, uso de medicamentos, restrição, recomendação médica ou fator que possa impactar sua segurança durante a prática esportiva.</P>
        <P>10.4. O SOMMA CLUB não substitui acompanhamento médico, fisioterapêutico, nutricional, psicológico ou qualquer outro serviço de saúde.</P>
        <P>10.5. O CONTRATANTE é responsável por buscar liberação médica quando necessário e por respeitar seus próprios limites físicos.</P>
        <P>10.6. O SOMMA CLUB não se responsabiliza por danos decorrentes de omissão de informações médicas, descumprimento das orientações técnicas, execução inadequada de exercícios, excesso de esforço, uso de equipamentos impróprios ou participação em atividades sem condições físicas adequadas.</P>
        <P>10.7. Caso o professor ou representante do SOMMA CLUB identifique risco relevante à integridade do CONTRATANTE ou de terceiros, poderá recomendar interrupção, adaptação ou suspensão da atividade.</P>
      </Clause>

      <Clause n="11. Treinos, Eventos e Experiências">
        <P>11.1. Os treinos, eventos e experiências poderão ocorrer em locais públicos, privados, parceiros, academias, parques, ruas, pistas, clubes, espaços de treinamento ou ambientes digitais.</P>
        <P>11.2. A programação poderá sofrer alterações por motivo climático, segurança, logística, agenda, disponibilidade de local, orientação de autoridades públicas, baixa adesão, eventos externos ou qualquer outro motivo operacional relevante.</P>
        <P>11.3. O SOMMA CLUB poderá remarcar, adaptar, substituir ou cancelar atividades, sem que isso gere automaticamente direito a reembolso, desde que mantenha a prestação geral dos serviços contratados.</P>
        <P>11.4. Benefícios, ativações, brindes, experiências, eventos com parceiros e ações promocionais poderão ter vagas limitadas, regras próprias e disponibilidade condicionada.</P>
        <P>11.5. A participação do CONTRATANTE em eventos de terceiros, provas oficiais, corridas externas ou competições não está incluída no plano, salvo comunicação expressa em sentido contrário.</P>
      </Clause>

      <Clause n="12. Uso da Plataforma, Grupos e Canais Digitais">
        <P>12.1. O CONTRATANTE poderá ter acesso a plataforma digital, grupos de WhatsApp, e-mail, formulários, check-ins, sistemas de feedback, área do aluno ou outros canais oficiais.</P>
        <P>12.2. O acesso é pessoal, individual e intransferível.</P>
        <P>12.3. É proibido compartilhar login, senha, treinos, planilhas, conteúdos, materiais, links restritos ou informações internas com terceiros não autorizados.</P>
        <P>12.4. O CONTRATANTE deverá utilizar os canais de comunicação com respeito, boa-fé, urbanidade e finalidade compatível com os serviços contratados.</P>
        <P>12.5. O SOMMA CLUB poderá remover mensagens, limitar acessos ou excluir o CONTRATANTE de grupos e canais em caso de conduta inadequada, spam, ofensa, assédio, discriminação, divulgação indevida, conflito com membros, promoção comercial não autorizada ou descumprimento das regras internas.</P>
      </Clause>

      <Clause n="13. Conduta do Contratante">
        <P>13.1. O CONTRATANTE compromete-se a respeitar professores, membros, alunos, parceiros, equipe, voluntários, organizadores, terceiros e demais participantes da comunidade.</P>
        <P>13.2. O SOMMA CLUB poderá suspender ou encerrar o acesso do CONTRATANTE em caso de conduta inadequada, violenta, ofensiva, discriminatória, abusiva, perigosa, fraudulenta ou incompatível com a cultura da comunidade.</P>
        <P>13.3. Também poderá haver suspensão ou encerramento em caso de uso indevido da marca SOMMA CLUB, comercialização não autorizada, captação de alunos, divulgação de produtos ou serviços concorrentes, tumulto, perturbação das atividades, fraude em check-ins ou descumprimento de orientações de segurança.</P>
        <P>13.4. A exclusão por justa causa não elimina valores vencidos nem obrigações financeiras assumidas pelo CONTRATANTE.</P>
      </Clause>

      <Clause n="14. Direito de Imagem, Voz, Nome e Depoimento">
        <P>14.1. O CONTRATANTE autoriza o SOMMA CLUB a captar, utilizar, editar, reproduzir, publicar, divulgar e compartilhar sua imagem, voz, nome, apelido, depoimentos e registros de participação em treinos, eventos, corridas, experiências, aulas, ativações, bastidores e demais ações relacionadas ao SOMMA CLUB.</P>
        <P>14.2. A autorização inclui uso em redes sociais, sites, landing pages, anúncios, mídia paga, materiais institucionais, propostas comerciais, apresentações para parceiros, portfólios, releases, vídeos, fotos, campanhas, materiais impressos, conteúdos promocionais e demais canais físicos ou digitais.</P>
        <P>14.3. A autorização é concedida de forma gratuita, por prazo indeterminado, no Brasil e no exterior, sem que seja devido qualquer pagamento, remuneração, indenização ou compensação.</P>
        <P>14.4. O SOMMA CLUB poderá compartilhar os materiais com patrocinadores, apoiadores, parceiros comerciais, produtoras, agências, veículos de mídia e fornecedores envolvidos nas ações, sempre vinculados à divulgação institucional, esportiva, promocional ou comercial do SOMMA CLUB.</P>
        <P>14.5. O CONTRATANTE poderá solicitar a interrupção de usos futuros de sua imagem mediante pedido formal. A solicitação não terá efeito retroativo sobre materiais já publicados, impressos, veiculados, compartilhados por terceiros ou integrados a campanhas já executadas.</P>
      </Clause>

      <Clause n="15. Proteção de Dados Pessoais e LGPD">
        <P>15.1. O CONTRATANTE autoriza o SOMMA CLUB a coletar, armazenar, tratar e utilizar seus dados pessoais para fins de cadastro, pagamento, gestão do plano, comunicação, acompanhamento esportivo, organização de treinos, feedbacks, eventos, benefícios, segurança, marketing, análise de desempenho, relacionamento e cumprimento de obrigações legais.</P>
        <P>15.2. Poderão ser tratados dados como nome, CPF, data de nascimento, telefone, e-mail, endereço, dados de pagamento, histórico de contratação, presença em atividades, feedbacks, preferências, objetivos esportivos, informações de saúde fornecidas voluntariamente, imagem, voz, dados de navegação, cookies e demais informações necessárias.</P>
        <P>15.3. O CONTRATANTE autoriza o compartilhamento de dados pessoais com professores, prestadores de serviço, plataformas de pagamento, ferramentas de gestão, empresas de tecnologia, operadores de comunicação, parceiros comerciais, patrocinadores, apoiadores, organizadores de eventos e fornecedores envolvidos na operação do SOMMA CLUB.</P>
        <P>15.4. O compartilhamento será realizado na medida necessária para viabilizar os serviços, pagamentos, benefícios, eventos, comunicação, segurança, campanhas, ações promocionais e melhoria da experiência do CONTRATANTE.</P>
        <P>15.5. O CONTRATANTE poderá solicitar acesso, correção, confirmação de tratamento, informações sobre compartilhamento, revogação de consentimento e demais direitos previstos na legislação aplicável, pelos canais oficiais do SOMMA CLUB.</P>
        <P>15.6. A revogação do consentimento poderá limitar ou inviabilizar o acesso a determinados serviços, benefícios, eventos ou funcionalidades que dependam do tratamento dos dados.</P>
      </Clause>

      <Clause n="16. Propriedade Intelectual">
        <P>16.1. Planilhas, treinos, métodos, conteúdos, aulas, materiais, orientações, textos, vídeos, imagens, comunicações, formulários, processos, marcas, identidade visual e demais materiais disponibilizados pelo SOMMA CLUB são de titularidade da CONTRATADA ou licenciados a ela.</P>
        <P>16.2. É proibida a reprodução, distribuição, venda, compartilhamento, adaptação ou uso comercial dos materiais sem autorização prévia e expressa do SOMMA CLUB.</P>
        <P>16.3. A violação desta cláusula poderá gerar bloqueio de acesso, rescisão contratual e adoção das medidas legais cabíveis.</P>
      </Clause>

      <Clause n="17. Reajuste de Valores">
        <P>17.1. Os valores dos planos poderão ser reajustados anualmente com base em índice oficial, variação de custos, alteração de estrutura, atualização comercial ou reposicionamento dos serviços.</P>
        <P>17.2. O SOMMA CLUB informará previamente alterações de valores aplicáveis a planos recorrentes, observadas as regras do plano contratado.</P>
        <P>17.3. Promoções, descontos e condições especiais poderão ser encerrados, alterados ou substituídos a qualquer momento para novas contratações.</P>
      </Clause>

      <Clause n="18. Vigência">
        <P>18.1. Este contrato terá vigência pelo prazo do plano contratado ou por prazo indeterminado enquanto houver vínculo ativo entre as partes.</P>
        <P>18.2. O contrato permanecerá válido enquanto o CONTRATANTE mantiver plano ativo, acesso aos serviços, débitos pendentes, obrigações contratuais ou relação operacional com o SOMMA CLUB.</P>
        <P>18.3. Algumas cláusulas permanecerão válidas mesmo após o encerramento do contrato, especialmente as relacionadas a pagamento, inadimplência, propriedade intelectual, uso de imagem, proteção de dados, responsabilidade e solução de conflitos.</P>
      </Clause>

      <Clause n="19. Disposições Gerais">
        <P>19.1. Este contrato integra as condições comerciais apresentadas no momento da contratação.</P>
        <P>19.2. Em caso de conflito entre este contrato e as condições específicas do plano ativo, prevalecerão as condições específicas do plano, desde que tenham sido informadas ao CONTRATANTE de forma clara.</P>
        <P>19.3. A tolerância de uma parte quanto ao descumprimento de qualquer obrigação pela outra não significará renúncia, perdão, novação ou alteração contratual.</P>
        <P>19.4. O SOMMA CLUB poderá atualizar este contrato para refletir mudanças legais, operacionais, comerciais ou tecnológicas, comunicando o CONTRATANTE por seus canais oficiais.</P>
        <P>19.5. Caso qualquer cláusula seja considerada inválida ou inexequível, as demais permanecerão plenamente válidas.</P>
      </Clause>

      <Clause n="20. Foro e Solução de Conflitos">
        <P>20.1. As partes buscarão resolver eventuais conflitos de forma amigável, por meio dos canais oficiais de atendimento do SOMMA CLUB.</P>
        <P>20.2. Não sendo possível a solução amigável, fica eleito o foro de Brasília/DF, salvo quando a legislação aplicável assegurar ao consumidor a escolha de foro diverso.</P>
      </Clause>

      <p className="pt-2 text-sm text-muted">
        Ao marcar a caixa de aceite no checkout, o CONTRATANTE declara que leu e aceita este Contrato
        de Prestação de Serviços da Assessoria Somma Club, incluindo as regras de plano, pagamento,
        fidelidade, cancelamento, recomposição de desconto, inadimplência, responsabilidade pela
        prática esportiva, uso de imagem e tratamento de dados pessoais.
      </p>
    </article>
  );
}

function Clause({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <section className="pt-2">
      <h2 className="text-lg font-semibold text-ink">{n}</h2>
      <div className="mt-1 space-y-1.5">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>;
}
