// Conteúdo do Contrato de Prestação de Serviços da Assessoria Somma Club.
// Reutilizado na página /contrato e no modal do checkout.
export function ContratoAssessoria() {
  return (
    <article className="space-y-4 text-[15px] leading-relaxed text-ink/90">
      <header>
        <h1 className="text-2xl font-bold text-ink">
          Contrato de Prestação de Serviços de Assessoria Esportiva
        </h1>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Assessoria Somma Club</p>
      </header>

      <div className="rounded-2xl bg-light p-4 text-sm">
        <p className="font-semibold text-ink">CONTRATADA</p>
        <p className="mt-1">
          SOMMA EMPREENDIMENTOS ESPORTIVOS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ
          sob o nº 61.315.987/0001-28, com sede no ST de Rádio e TV Sul, Quadra 701, Conjunto L, Bloco
          02, nº 30, Sala 417 Parte K 52, Asa Sul, Brasília, Distrito Federal, CEP 70.340-906,
          doravante denominada simplesmente SOMMA CLUB ou CONTRATADA.
        </p>
        <p className="mt-3 font-semibold text-ink">CONTRATANTE</p>
        <p className="mt-1">
          Pessoa física identificada no cadastro eletrônico, checkout, plataforma de contratação ou
          instrumento de adesão vinculado a este contrato, doravante denominada simplesmente
          CONTRATANTE.
        </p>
        <p className="mt-2 text-muted">
          As partes têm entre si justo e contratado o presente Contrato de Prestação de Serviços de
          Assessoria Esportiva, que será regido pelas cláusulas e condições seguintes.
        </p>
      </div>

      <Clause n="1. Objeto">
        <P>1.1. O presente contrato tem por objeto a prestação de serviços de assessoria esportiva, planejamento e orientação de treinos, acompanhamento esportivo, organização de atividades físicas, experiências esportivas, treinos coletivos, comunicações técnicas e demais atividades relacionadas à Assessoria SOMMA Club.</P>
        <P>1.2. Os serviços poderão incluir, conforme o plano contratado, prescrição individualizada de treinos, acompanhamento por profissionais, acesso a plataforma de treinamento, participação em grupos de comunicação, feedbacks, avaliações de evolução, treinos presenciais, orientações gerais de corrida, fortalecimento, mobilidade, eventos internos, experiências e benefícios disponibilizados pela CONTRATADA.</P>
        <P>1.3. A composição exata dos serviços, benefícios, periodicidade, modalidade de atendimento, valor, duração e forma de pagamento será determinada pelo plano escolhido pelo CONTRATANTE no momento da contratação.</P>
        <P>1.4. Os serviços poderão ser prestados de forma presencial, remota, digital ou híbrida.</P>
        <P>1.5. O acesso, gestão, pagamentos, comunicados, check-ins, prescrições, feedbacks e demais interações poderão ocorrer por plataforma digital, site, aplicativo, WhatsApp, e-mail, sistema de gestão, plataforma de pagamento ou qualquer outro canal oficial utilizado pelo SOMMA CLUB.</P>
        <P>1.6. Este contrato estabelece as condições gerais da relação entre as partes e será complementado pelo Quadro Resumo da Contratação, exibido ao CONTRATANTE no momento da adesão.</P>
      </Clause>

      <Clause n="2. Quadro Resumo da Contratação">
        <P>2.1. No momento da contratação deverão ser informados de forma clara ao CONTRATANTE:</P>
        <L
          items={[
            "nome do plano;",
            "valor total contratado;",
            "forma de pagamento;",
            "quantidade de parcelas, quando houver;",
            "prazo de vigência;",
            "existência ou não de permanência mínima;",
            "principais benefícios incluídos;",
            "regras específicas de cancelamento;",
            "eventuais condições promocionais.",
          ]}
        />
        <P>2.2. O Quadro Resumo integra este contrato para todos os fins.</P>
        <P>2.3. Nos planos com permanência mínima, essa condição deverá ser apresentada de maneira ostensiva antes da conclusão da contratação.</P>
      </Clause>

      <Clause n="3. Adesão e Aceite Digital">
        <P>3.1. A adesão poderá ocorrer presencialmente ou por meio digital, mediante cadastro, escolha de plano, pagamento, aceite eletrônico, assinatura digital ou qualquer outra manifestação válida de vontade.</P>
        <P>3.2. O aceite eletrônico deste contrato produzirá os efeitos jurídicos correspondentes à manifestação expressa de vontade do CONTRATANTE.</P>
        <P>3.3. Ao concluir a contratação, o CONTRATANTE declara que teve acesso ao contrato, ao Quadro Resumo e às condições comerciais aplicáveis ao plano escolhido.</P>
        <P>3.4. O SOMMA CLUB poderá registrar informações relacionadas ao aceite, incluindo data, horário, versão do contrato, identificação do usuário, CPF, e-mail, telefone, endereço IP, dispositivo utilizado, comprovantes de pagamento e demais registros tecnicamente disponíveis.</P>
        <P>3.5. Uma cópia do contrato ou acesso à sua versão vigente deverá permanecer disponível ao CONTRATANTE por meio eletrônico.</P>
      </Clause>

      <Clause n="4. Planos e Condições Comerciais">
        <P>4.1. A Assessoria SOMMA Club poderá comercializar planos mensais, trimestrais, semestrais, anuais, corporativos, promocionais, experimentais ou personalizados.</P>
        <P>4.2. Cada modalidade poderá possuir valor, prazo, benefícios, forma de pagamento e regras específicas.</P>
        <P>4.3. O fato de planos de maior duração possuírem valor proporcionalmente inferior ao plano mensal decorre do compromisso de permanência assumido pelo CONTRATANTE.</P>
        <P>4.4. Promoções, descontos e condições especiais serão válidos conforme as condições apresentadas no momento da contratação.</P>
        <P>4.5. Benefícios promocionais não serão necessariamente cumulativos com outras campanhas ou condições comerciais.</P>
        <P>4.6. O não comparecimento a treinos, a falta de utilização do aplicativo, a ausência em eventos, férias pessoais, rotina profissional, viagens ou qualquer decisão pessoal do CONTRATANTE de não utilizar o serviço não suspende automaticamente o contrato e não elimina as obrigações financeiras assumidas.</P>
      </Clause>

      <Clause n="5. Plano Anual e Permanência Mínima">
        <P>5.1. Quando o CONTRATANTE optar pelo Plano Anual, estará contratando um serviço com vigência determinada de 12 meses, contados a partir da data de início indicada no Quadro Resumo.</P>
        <P>5.2. O Plano Anual possui preço total correspondente aos 12 meses de contratação.</P>
        <P>5.3. Caso o SOMMA CLUB permita o pagamento do valor anual em parcelas, o parcelamento constituirá exclusivamente uma facilidade de pagamento do preço total contratado e não transformará o Plano Anual em plano mensal.</P>
        <P>5.4. Dessa forma, o CONTRATANTE reconhece que a contratação anual representa compromisso de permanência durante os 12 meses contratados.</P>
        <P>5.5. O simples fato de o CONTRATANTE deixar de frequentar treinos, utilizar a plataforma, enviar feedbacks, acessar grupos ou participar das atividades não caracteriza cancelamento, suspensão ou encerramento do contrato.</P>
        <P>5.6. Enquanto não houver solicitação formal de cancelamento realizada nos termos deste contrato, o Plano Anual continuará ativo e as cobranças contratadas permanecerão devidas até o encerramento do prazo de 12 meses.</P>
        <P>5.7. Ao final dos 12 meses, eventual continuidade ou renovação observará as condições comerciais apresentadas ao CONTRATANTE e a legislação aplicável.</P>
      </Clause>

      <Clause n="6. Cancelamento Antecipado do Plano Anual">
        <P>6.1. O CONTRATANTE poderá solicitar a rescisão antecipada do Plano Anual antes do término dos 12 meses.</P>
        <P>6.2. A possibilidade de rescisão antecipada não descaracteriza o compromisso anual assumido no momento da contratação.</P>
        <P>6.3. Em razão da quebra antecipada do período de permanência contratado, será devida multa rescisória equivalente a 20% do saldo contratual remanescente na data do cancelamento.</P>
        <P>6.4. Para fins desta cláusula, entende-se como saldo contratual remanescente a soma dos valores correspondentes ao período compreendido entre a data efetiva do cancelamento e a data originalmente prevista para encerramento do Plano Anual.</P>
        <P>6.5. A fórmula será:</P>
        <p className="rounded-xl bg-light px-4 py-3 text-sm font-semibold text-ink">
          Multa de cancelamento = saldo contratual remanescente × 20%.
        </p>
        <P>6.6. A multa não será calculada sobre valores referentes ao período já integralmente cumprido.</P>
        <P>6.7. Não haverá cobrança simultânea de recomposição de desconto e multa rescisória sobre o mesmo cancelamento.</P>
        <P>6.8. Caso existam mensalidades, parcelas ou valores já vencidos na data da solicitação de cancelamento, estes continuarão integralmente devidos, independentemente da multa rescisória.</P>
        <P>6.9. O encerramento antecipado implicará perda dos benefícios vinculados à condição de aluno ativo, observadas eventuais condições específicas do plano.</P>
        <P>6.10. Quando houver pagamento antecipado integral do Plano Anual, eventual valor referente ao período posterior à data efetiva de cancelamento será apurado proporcionalmente.</P>
        <P>6.11. Sobre o saldo correspondente ao período não utilizado será aplicada a multa rescisória prevista nesta cláusula, juntamente com eventuais valores vencidos ou outras obrigações legitimamente devidas.</P>
        <P>6.12. Havendo saldo líquido favorável ao CONTRATANTE após a apuração prevista no item anterior, o valor será restituído pelo meio operacionalmente disponível, observados os prazos do sistema financeiro e da plataforma de pagamento utilizada.</P>
        <P>6.13. A multa não será aplicada quando o encerramento ocorrer por descumprimento contratual comprovadamente imputável ao SOMMA CLUB ou em situação na qual a legislação determine solução diversa.</P>
      </Clause>

      <Clause n="7. Plano Mensal e Demais Planos">
        <P>7.1. O plano mensal sem permanência mínima poderá ser cancelado a qualquer momento, observadas as condições do ciclo de faturamento em andamento.</P>
        <P>7.2. O cancelamento impede novas cobranças após o encerramento do ciclo aplicável, sem prejuízo de valores já vencidos.</P>
        <P>7.3. Planos semestrais, promocionais ou outros planos com permanência mínima poderão possuir regra de cancelamento equivalente à prevista para o Plano Anual, desde que a condição seja informada no Quadro Resumo.</P>
        <P>7.4. Eventuais condições comerciais específicas prevalecerão quando forem mais favoráveis ao CONTRATANTE ou quando decorrerem de exigência legal.</P>
      </Clause>

      <Clause n="8. Procedimento de Cancelamento">
        <P>8.1. O cancelamento deverá ser solicitado por canal oficial disponibilizado pelo SOMMA CLUB.</P>
        <P>8.2. O pedido deverá permitir a identificação do CONTRATANTE e do respectivo plano.</P>
        <P>8.3. A data do protocolo ou registro eletrônico será considerada para identificação da solicitação de cancelamento.</P>
        <P>8.4. O SOMMA CLUB poderá solicitar confirmação de identidade para evitar cancelamentos fraudulentos ou realizados por terceiros.</P>
        <P>8.5. Após o processamento do pedido, o CONTRATANTE receberá demonstrativo contendo, quando aplicável:</P>
        <L
          items={[
            "data efetiva de encerramento;",
            "valores vencidos;",
            "saldo contratual remanescente;",
            "valor da multa rescisória;",
            "eventual saldo a pagar ou restituir.",
          ]}
        />
        <P>8.6. A ausência de frequência ou a simples comunicação informal a professor, membro da equipe ou terceiro não substitui a solicitação de cancelamento realizada por canal oficial.</P>
      </Clause>

      <Clause n="9. Direito de Arrependimento">
        <P>9.1. Nas hipóteses em que a legislação consumerista assegurar direito de arrependimento em contratação realizada fora do estabelecimento comercial, será observado o prazo legal aplicável.</P>
        <P>9.2. O exercício regular do direito de arrependimento dentro do prazo legal não estará sujeito à multa rescisória.</P>
        <P>9.3. O SOMMA CLUB poderá disponibilizar procedimento digital específico para esse tipo de solicitação.</P>
      </Clause>

      <Clause n="10. Alteração de Plano">
        <P>10.1. O CONTRATANTE poderá solicitar upgrade ou downgrade de plano.</P>
        <P>10.2. A alteração dependerá das condições comerciais disponíveis no momento da solicitação.</P>
        <P>10.3. A mudança poderá gerar novo valor, nova vigência, novo ciclo financeiro e novo prazo de permanência.</P>
        <P>10.4. Quando a alteração resultar em novo período de fidelidade, essa condição deverá ser apresentada ao CONTRATANTE antes da confirmação.</P>
        <P>10.5. O SOMMA CLUB poderá impedir alteração enquanto existirem valores vencidos ou inconsistências cadastrais que inviabilizem a operação.</P>
      </Clause>

      <Clause n="11. Pagamento">
        <P>11.1. Os pagamentos poderão ocorrer por cartão de crédito, Pix, boleto, assinatura recorrente, link de pagamento, plataforma de cobrança ou outro meio disponibilizado pela CONTRATADA.</P>
        <P>11.2. O CONTRATANTE é responsável pela atualização de seus dados de pagamento.</P>
        <P>11.3. O pagamento parcelado de plano anual ou de qualquer plano com prazo determinado representa parcelamento do preço contratado e não contratação independente de cada mês.</P>
        <P>11.4. Eventuais taxas, juros de parcelamento ou encargos decorrentes do meio de pagamento deverão ser previamente informados quando aplicáveis.</P>
        <P>11.5. O CONTRATANTE reconhece que frequência e pagamento são obrigações distintas.</P>
        <P>11.6. A falta de utilização do serviço por decisão pessoal do CONTRATANTE não interrompe automaticamente as cobranças de um contrato ainda ativo.</P>
      </Clause>

      <Clause n="12. Inadimplência">
        <P>12.1. O atraso no pagamento poderá gerar multa moratória de 2% sobre o valor vencido, acrescida dos juros legalmente aplicáveis e demais encargos permitidos pela legislação.</P>
        <P>12.2. Durante a inadimplência, o SOMMA CLUB poderá suspender acesso à plataforma, treinos, grupos, check-ins, eventos exclusivos, benefícios e demais serviços vinculados ao plano.</P>
        <P>12.3. A suspensão por inadimplência não equivale a cancelamento do contrato.</P>
        <P>12.4. Valores vencidos continuarão exigíveis.</P>
        <P>12.5. Após observadas as exigências legais aplicáveis, o SOMMA CLUB poderá adotar procedimentos administrativos ou judiciais de cobrança e utilizar os meios legalmente disponíveis para recuperação do crédito.</P>
        <P>12.6. A regularização poderá restabelecer o acesso aos serviços, desde que o contrato ainda esteja vigente.</P>
      </Clause>

      <Clause n="13. Suspensão Temporária">
        <P>13.1. A suspensão temporária não constitui direito automático do CONTRATANTE.</P>
        <P>13.2. A disponibilidade de suspensão dependerá do plano contratado e das regras comerciais vigentes.</P>
        <P>13.3. No Plano Anual, eventual suspensão excepcional poderá ser autorizada pelo SOMMA CLUB em situações justificadas, especialmente lesão, condição médica incapacitante, gravidez ou situação equivalente.</P>
        <P>13.4. Poderá ser exigida documentação compatível com a justificativa apresentada.</P>
        <P>13.5. Quando houver suspensão autorizada, o prazo de vigência poderá ser prorrogado pelo mesmo período da suspensão.</P>
        <P>13.6. Viagens, férias, compromissos profissionais, mudança temporária de rotina ou ausência voluntária não gerarão automaticamente direito à suspensão.</P>
        <P>13.7. As condições específicas de quantidade máxima de suspensões e duração poderão ser estabelecidas no Quadro Resumo ou regulamento operacional aplicável ao plano.</P>
      </Clause>

      <Clause n="14. Responsabilidade, Saúde e Aptidão Física">
        <P>14.1. O CONTRATANTE declara ser responsável por avaliar suas condições para prática de atividades físicas.</P>
        <P>14.2. O CONTRATANTE reconhece que corrida, fortalecimento, exercícios físicos, atividades ao ar livre e eventos esportivos apresentam riscos inerentes à atividade.</P>
        <P>14.3. Entre os riscos possíveis estão quedas, lesões, fadiga, mal-estar, desidratação, acidentes, contato com terceiros, condições climáticas e outras ocorrências próprias da prática esportiva.</P>
        <P>14.4. O CONTRATANTE compromete-se a comunicar aos profissionais responsáveis qualquer informação relevante sobre limitações físicas ou condições que possam comprometer sua segurança durante os treinos.</P>
        <P>14.5. O SOMMA CLUB poderá recomendar avaliação ou liberação médica quando considerar necessário.</P>
        <P>14.6. A assessoria esportiva não substitui atendimento médico, fisioterapêutico, nutricional, psicológico ou outro serviço de saúde.</P>
        <P>14.7. O CONTRATANTE compromete-se a respeitar as orientações técnicas recebidas e seus limites individuais.</P>
        <P>14.8. Caso seja identificado risco relevante para o CONTRATANTE ou para terceiros, o profissional responsável poderá interromper ou adaptar determinada atividade.</P>
        <P>14.9. Nenhuma disposição deste contrato excluirá responsabilidades que legalmente sejam atribuíveis à CONTRATADA.</P>
      </Clause>

      <Clause n="15. Treinos, Eventos e Experiências">
        <P>15.1. Os treinos e experiências poderão ocorrer em parques, ruas, pistas, academias, estabelecimentos parceiros, clubes, ambientes privados, espaços públicos ou ambientes digitais.</P>
        <P>15.2. Horários, locais, professores, percursos e formatos poderão sofrer alterações por razões operacionais justificadas.</P>
        <P>15.3. Poderão ser consideradas razões justificadas condições climáticas, segurança, interdição de espaços, determinações públicas, logística, disponibilidade de profissionais, eventos externos ou outras circunstâncias relevantes.</P>
        <P>15.4. O SOMMA CLUB buscará comunicar alterações pelos canais oficiais.</P>
        <P>15.5. Benefícios, ativações, brindes e experiências com parceiros poderão possuir disponibilidade limitada e regulamentos próprios.</P>
        <P>15.6. A inscrição em provas oficiais, competições ou eventos realizados por terceiros não estará incluída no plano, salvo indicação expressa.</P>
        <P>15.7. Alterações pontuais de programação que não comprometam substancialmente o objeto principal da assessoria não gerarão automaticamente direito a abatimento.</P>
      </Clause>

      <Clause n="16. Plataforma, Grupos e Canais Digitais">
        <P>16.1. O CONTRATANTE poderá receber acesso a sistemas, aplicativos, grupos de WhatsApp, check-ins, formulários, área do aluno ou outros canais utilizados pela Assessoria SOMMA Club.</P>
        <P>16.2. O acesso é individual e intransferível.</P>
        <P>16.3. Credenciais não poderão ser compartilhadas com terceiros.</P>
        <P>16.4. Treinos individualizados, planilhas, vídeos, materiais e conteúdos disponibilizados em ambiente restrito não poderão ser distribuídos publicamente sem autorização.</P>
        <P>16.5. Os canais deverão ser utilizados com respeito, boa-fé e compatibilidade com a finalidade da comunidade.</P>
        <P>16.6. Mensagens comerciais não autorizadas, spam, assédio, ofensas, discriminação ou utilização inadequada poderão resultar em restrição dos canais.</P>
      </Clause>

      <Clause n="17. Conduta e Convivência">
        <P>17.1. O CONTRATANTE compromete-se a respeitar professores, colaboradores, membros, alunos, parceiros, voluntários, organizadores e terceiros.</P>
        <P>17.2. Poderão resultar em advertência, suspensão ou encerramento do acesso condutas violentas, ofensivas, discriminatórias, abusivas, fraudulentas ou que coloquem outras pessoas em risco.</P>
        <P>17.3. Também poderão ser consideradas infrações:</P>
        <L
          items={[
            "fraude em check-ins;",
            "compartilhamento irregular de acesso;",
            "comercialização não autorizada dentro dos canais da assessoria;",
            "utilização indevida da marca SOMMA;",
            "captação comercial não autorizada dentro dos grupos;",
            "perturbação reiterada das atividades;",
            "descumprimento de orientações essenciais de segurança.",
          ]}
        />
        <P>17.4. Antes do encerramento por motivo disciplinar, serão consideradas a gravidade da conduta e as circunstâncias do caso, ressalvadas situações que demandem afastamento imediato por segurança.</P>
        <P>17.5. A rescisão por infração não elimina valores regularmente vencidos antes do encerramento.</P>
      </Clause>

      <Clause n="18. Propriedade Intelectual">
        <P>18.1. Planilhas, prescrições de treino, métodos, materiais, aulas, vídeos, textos, sistemas, processos, formulários, marcas e conteúdos disponibilizados pelo SOMMA CLUB são protegidos pela legislação aplicável.</P>
        <P>18.2. A utilização pessoal pelo CONTRATANTE está autorizada enquanto necessária para usufruir o serviço.</P>
        <P>18.3. É proibida a reprodução comercial, venda, licenciamento, disponibilização pública ou distribuição sistemática desses materiais sem autorização.</P>
        <P>18.4. O descumprimento poderá resultar em bloqueio do acesso e adoção das medidas legalmente cabíveis.</P>
      </Clause>

      <Clause n="19. Proteção de Dados Pessoais">
        <P>19.1. O SOMMA CLUB realizará o tratamento de dados pessoais necessários à execução deste contrato, gestão do relacionamento com o CONTRATANTE, cobrança, segurança, comunicação operacional e cumprimento de obrigações legais.</P>
        <P>19.2. Poderão ser tratados, conforme necessários para cada finalidade, dados de identificação, contato, contratação, pagamento, utilização da plataforma, participação em atividades e registros operacionais.</P>
        <P>19.3. O tratamento poderá ocorrer com fundamento nas bases legais previstas na legislação aplicável, incluindo execução contratual, cumprimento de obrigação legal, exercício regular de direitos, proteção do crédito, legítimo interesse quando cabível e consentimento quando necessário.</P>
        <P>19.4. Dados pessoais poderão ser processados por prestadores de serviços utilizados pelo SOMMA CLUB, incluindo plataformas de pagamento, hospedagem, tecnologia, atendimento, comunicação e gestão esportiva, nos limites necessários à prestação dos respectivos serviços.</P>
        <P>19.5. O SOMMA CLUB adotará medidas razoáveis de segurança compatíveis com a natureza dos dados tratados.</P>
        <P>19.6. Os dados serão mantidos durante o período necessário para as finalidades que justificaram sua coleta e durante os prazos necessários ao cumprimento de obrigações legais e exercício regular de direitos.</P>
        <P>19.7. O CONTRATANTE poderá exercer os direitos previstos na legislação de proteção de dados por meio dos canais oficiais disponibilizados pela CONTRATADA.</P>
      </Clause>

      <Clause n="20. Dados Relacionados à Saúde">
        <P>20.1. Informações relacionadas à saúde são consideradas dados pessoais sensíveis e receberão tratamento compatível com essa natureza.</P>
        <P>20.2. Quando o tratamento depender de consentimento do CONTRATANTE, a autorização deverá ser obtida de forma específica e destacada.</P>
        <P>20.3. Informações de saúde eventualmente fornecidas pelo CONTRATANTE serão utilizadas para finalidades relacionadas à segurança, adequação dos treinamentos ou exercício regular de direitos, observadas as bases legais aplicáveis.</P>
        <P>20.4. Dados pessoais sensíveis relacionados à saúde não serão disponibilizados a patrocinadores ou parceiros comerciais para finalidade publicitária.</P>
      </Clause>

      <Clause n="21. Uso de Imagem e Voz">
        <P>21.1. A autorização para utilização promocional de imagem, voz, nome ou depoimento do CONTRATANTE será tratada separadamente do aceite obrigatório deste contrato.</P>
        <P>21.2. O CONTRATANTE poderá autorizar o SOMMA CLUB, por manifestação específica, a utilizar registros produzidos em treinos, eventos e experiências para divulgação institucional, redes sociais, campanhas, materiais de comunicação, mídia e apresentações da marca.</P>
        <P>21.3. A negativa dessa autorização não impedirá a contratação dos serviços regulares de assessoria.</P>
        <P>21.4. A autorização poderá prever utilização gratuita dos registros, observados seus limites e finalidades.</P>
        <P>21.5. O CONTRATANTE poderá solicitar a interrupção de novos usos quando a autorização estiver baseada em consentimento, sem efeito retroativo sobre materiais já legitimamente produzidos ou divulgados, ressalvados os direitos assegurados pela legislação.</P>
      </Clause>

      <Clause n="22. Benefícios e Parceiros">
        <P>22.1. O SOMMA CLUB poderá disponibilizar benefícios oferecidos diretamente ou por parceiros.</P>
        <P>22.2. Descontos, vouchers, cortesias, ativações e demais vantagens poderão possuir prazo, disponibilidade e regras próprias.</P>
        <P>22.3. Benefícios oferecidos por terceiros poderão ser alterados ou encerrados pelo respectivo parceiro.</P>
        <P>22.4. O encerramento isolado de benefício acessório não caracteriza necessariamente descumprimento do objeto principal da assessoria.</P>
        <P>22.5. O SOMMA CLUB buscará manter o CONTRATANTE informado sobre os benefícios disponíveis durante a vigência do plano.</P>
      </Clause>

      <Clause n="23. Reajuste">
        <P>23.1. Os preços poderão ser atualizados para novas contratações a qualquer momento.</P>
        <P>23.2. Durante prazo determinado já contratado, o preço observará as condições definidas no respectivo Quadro Resumo, salvo alteração expressamente aceita pelas partes ou permitida pela legislação.</P>
        <P>23.3. Planos recorrentes por prazo indeterminado poderão sofrer reajuste mediante comunicação prévia ao CONTRATANTE.</P>
        <P>23.4. Promoções e preços especiais não geram direito adquirido para futuras renovações.</P>
      </Clause>

      <Clause n="24. Vigência e Encerramento">
        <P>24.1. A vigência será determinada pelo plano contratado.</P>
        <P>24.2. O Plano Anual possuirá vigência de 12 meses.</P>
        <P>24.3. O Plano Mensal sem fidelidade permanecerá ativo de acordo com seu ciclo de contratação até cancelamento.</P>
        <P>24.4. O encerramento do contrato não prejudicará obrigações que, por sua natureza, devam permanecer válidas, incluindo pagamentos vencidos, proteção de dados, propriedade intelectual e exercício regular de direitos.</P>
        <P>24.5. O encerramento da prestação de serviços futuros não significa renúncia a créditos regularmente constituídos durante a vigência contratual.</P>
      </Clause>

      <Clause n="25. Alterações Contratuais">
        <P>25.1. O SOMMA CLUB poderá atualizar as condições gerais para novas contratações.</P>
        <P>25.2. Alterações materiais que aumentem obrigações ou restrinjam direitos de CONTRATANTE que já esteja em plano com prazo determinado não serão aplicadas retroativamente sem fundamento legal ou concordância do CONTRATANTE.</P>
        <P>25.3. Mudanças meramente operacionais que não alterem substancialmente o objeto ou equilíbrio econômico do contrato poderão ser comunicadas pelos canais oficiais.</P>
      </Clause>

      <Clause n="26. Disposições Gerais">
        <P>26.1. Este contrato deverá ser interpretado juntamente com o Quadro Resumo e demais condições expressamente apresentadas no momento da contratação.</P>
        <P>26.2. Em caso de divergência, serão observadas as regras legais aplicáveis e a condição específica validamente apresentada ao CONTRATANTE.</P>
        <P>26.3. A tolerância de qualquer das partes quanto ao descumprimento de determinada obrigação não representará renúncia ao direito de exigir seu cumprimento posteriormente.</P>
        <P>26.4. A eventual invalidade de determinada disposição não afetará automaticamente as demais cláusulas.</P>
        <P>26.5. O SOMMA CLUB poderá utilizar prestadores de serviços, profissionais e fornecedores necessários à execução de partes da operação, permanecendo observadas as responsabilidades legalmente aplicáveis.</P>
      </Clause>

      <Clause n="27. Solução de Conflitos e Foro">
        <P>27.1. As partes buscarão prioritariamente solucionar eventuais divergências por meio dos canais oficiais de atendimento do SOMMA CLUB.</P>
        <P>27.2. Não sendo possível a solução consensual, será observada a competência territorial determinada pela legislação aplicável.</P>
        <P>27.3. Quando juridicamente válida a eleição contratual de foro, as partes indicam Brasília, Distrito Federal, sem prejuízo do foro assegurado ao consumidor pela legislação aplicável.</P>
      </Clause>

      <Clause n="28. Aceite Final">
        <P>Ao marcar a opção de aceite no checkout, assinar digitalmente ou concluir a contratação, o CONTRATANTE declara que recebeu acesso a este Contrato de Prestação de Serviços, ao Quadro Resumo do plano escolhido e às respectivas condições comerciais.</P>
        <P>O CONTRATANTE declara ciência de que, caso escolha plano com permanência mínima, especialmente o Plano Anual, estará assumindo compromisso pelo prazo informado no momento da contratação.</P>
        <P>O CONTRATANTE declara ciência de que o Plano Anual possui vigência de 12 meses e que eventual parcelamento representa apenas forma de pagamento do preço anual contratado.</P>
        <P>O CONTRATANTE declara ciência de que a simples interrupção da frequência ou utilização dos serviços não caracteriza cancelamento.</P>
        <P>O CONTRATANTE declara ciência de que o cancelamento antecipado do Plano Anual estará sujeito à multa rescisória de 20% sobre o saldo contratual remanescente, conforme previsto neste contrato.</P>
        <P>O CONTRATANTE declara ter tido oportunidade de acessar as condições antes da conclusão da contratação.</P>
      </Clause>
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

function L({ items }: { items: string[] }) {
  return (
    <ol className="ml-1 list-[lower-alpha] space-y-1 pl-5 text-muted marker:font-semibold">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}
