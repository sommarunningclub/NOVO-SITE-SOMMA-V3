import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Política de Privacidade e LGPD | SOMMA Club",
  description:
    "Termo de Consentimento para Tratamento de Dados Pessoais (LGPD) e Termo de Autorização de Uso de Imagem, Voz, Nome e Depoimento do SOMMA Club.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <header className="border-b border-black/5">
        <div className="container-somma flex h-16 items-center justify-between md:h-20">
          <Link href="/" aria-label="Voltar para a home">
            <Image src="/logo-somma-dark.svg" alt="SOMMA Club" width={120} height={32} className="h-7 w-auto md:h-8" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="container-somma max-w-3xl py-14 md:py-20">
        <h1 className="text-3xl font-semibold text-ink md:text-4xl">Política de Privacidade e LGPD</h1>
        <p className="mt-3 text-muted">
          SOMMA EMPREENDIMENTOS ESPORTIVOS LTDA · CNPJ 61.315.987/0001-28 · ST de Rádio e TV Sul,
          Quadra 701, Conjunto L, Bloco 02, nº 30, Sala 417 Parte K 52, Asa Sul, Brasília-DF, CEP
          70.340-906.
        </p>

        <article className="prose-somma mt-10 space-y-4 text-[15px] leading-relaxed text-ink/90">
          {/* ===== TERMO 1 ===== */}
          <h2 className="text-2xl font-semibold text-ink">
            1. Termo de Consentimento para Tratamento de Dados Pessoais
          </h2>
          <p>
            SOMMA EMPREENDIMENTOS ESPORTIVOS LTDA, pessoa jurídica de direito privado, inscrita no
            CNPJ sob o nº 61.315.987/0001-28, com sede no ST de Rádio e TV Sul, Quadra 701, Conjunto
            L, Bloco 02, nº 30, Sala 417 Parte K 52, Asa Sul, Brasília, DF, CEP 70.340-906, doravante
            denominada simplesmente SOMMA CLUB, apresenta este Termo de Consentimento para explicar
            como coleta, utiliza, armazena, compartilha e protege os dados pessoais dos usuários,
            membros, alunos, participantes, clientes, visitantes do site, inscritos em eventos,
            compradores da loja, participantes da assessoria esportiva e demais pessoas que interagem
            com seus canais físicos e digitais.
          </p>
          <p>
            Ao realizar cadastro, inscrição, compra, check-in, participação em evento, preenchimento
            de formulário, aceite em ambiente digital ou utilização dos serviços do SOMMA CLUB, o
            titular declara que leu, compreendeu e concorda com este Termo.
          </p>

          <h3 className="text-lg font-semibold text-ink">1. Dados que poderão ser coletados</h3>
          <p>
            O SOMMA CLUB poderá coletar dados como nome completo, CPF, RG, data de nascimento,
            telefone, e-mail, endereço, gênero, cidade, estado, dados de pagamento, histórico de
            compras, plano contratado, presença em eventos, check-ins, preferências esportivas,
            respostas em formulários, informações sobre treinos, evolução física, objetivos
            esportivos, nível de condicionamento, dados de saúde fornecidos voluntariamente, imagens,
            vídeos, voz, depoimentos, interações em redes sociais, dados de navegação no site,
            cookies, endereço IP, dispositivo utilizado, origem de acesso, campanhas de marketing e
            demais informações necessárias para a prestação dos serviços.
          </p>
          <p>
            Quando forem coletados dados relacionados à saúde, condicionamento físico, histórico de
            lesões, limitações, performance esportiva ou qualquer informação sensível, o tratamento
            será realizado com finalidade específica, observando os cuidados exigidos pela legislação
            aplicável.
          </p>

          <h3 className="text-lg font-semibold text-ink">2. Finalidades do tratamento dos dados</h3>
          <p>Os dados pessoais poderão ser utilizados para:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Realizar cadastro de membros, alunos, clientes e participantes.</li>
            <li>
              Permitir inscrição, check-in e participação em treinos, corridas, eventos, gincanas,
              ativações, assessorias esportivas e demais experiências promovidas pelo SOMMA CLUB.
            </li>
            <li>
              Organizar turmas, grupos, listas de presença, rankings, desafios, comunicados e ações
              da comunidade.
            </li>
            <li>
              Prestar serviços de assessoria esportiva, acompanhamento de treinos, comunicação com
              professores, organização de feedbacks e orientação esportiva.
            </li>
            <li>
              Processar pagamentos, assinaturas, pedidos, compras, reembolsos, cobranças e emissão de
              comprovantes.
            </li>
            <li>
              Enviar comunicações operacionais, mensagens de confirmação, avisos importantes,
              novidades, conteúdos, promoções, benefícios, convites e campanhas.
            </li>
            <li>
              Melhorar a experiência do usuário no site, aplicativo, loja, formulários, páginas de
              inscrição e demais canais digitais.
            </li>
            <li>
              Realizar ações de marketing, remarketing, análise de desempenho de campanhas,
              segmentação de público e mensuração de resultados.
            </li>
            <li>Cumprir obrigações legais, fiscais, regulatórias, contábeis e contratuais.</li>
            <li>
              Proteger a segurança dos participantes, da operação, dos eventos, dos sistemas e dos
              canais digitais do SOMMA CLUB.
            </li>
            <li>
              Gerar estatísticas, relatórios internos, análises de comunidade, performance, presença,
              engajamento e crescimento, preferencialmente de forma agregada ou anonimizada.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-ink">3. Compartilhamento de dados com parceiros</h3>
          <p>
            O titular autoriza o SOMMA CLUB a compartilhar seus dados pessoais, quando necessário ou
            adequado, com parceiros comerciais, patrocinadores, apoiadores, fornecedores, professores,
            prestadores de serviço, plataformas de pagamento, ferramentas de CRM, plataformas de
            e-mail, ferramentas de automação, empresas de tecnologia, empresas de marketing,
            operadores logísticos, organizadores de eventos, fotógrafos, produtoras, marcas parceiras,
            academias, lojas, empresas de benefícios e demais terceiros envolvidos na operação do
            SOMMA CLUB.
          </p>
          <p>
            Esse compartilhamento poderá ocorrer para viabilizar inscrições, eventos, treinos,
            assessoria, benefícios, descontos, ativações, experiências, comunicações, campanhas
            promocionais, análise de dados, atendimento ao cliente, segurança, pagamentos, entrega de
            produtos e melhoria dos serviços.
          </p>
          <p>
            O SOMMA CLUB se compromete a compartilhar apenas os dados necessários para cada finalidade
            e a buscar parceiros que adotem medidas razoáveis de segurança e proteção de dados. Quando
            o compartilhamento tiver finalidade promocional, comercial ou de marketing direto por
            parceiros, o titular poderá revogar sua autorização a qualquer momento, mediante
            solicitação pelos canais de contato do SOMMA CLUB.
          </p>

          <h3 className="text-lg font-semibold text-ink">4. Uso de cookies e tecnologias de rastreamento</h3>
          <p>
            O site do SOMMA CLUB poderá utilizar cookies, pixels, tags, ferramentas de analytics,
            ferramentas de mídia paga, identificadores digitais e tecnologias semelhantes para
            melhorar a navegação, medir audiência, entender comportamento, personalizar conteúdo,
            otimizar campanhas e realizar remarketing. O usuário poderá gerenciar ou bloquear cookies
            diretamente nas configurações do navegador, ciente de que algumas funcionalidades do site
            poderão ser afetadas.
          </p>

          <h3 className="text-lg font-semibold text-ink">5. Armazenamento e segurança</h3>
          <p>
            O SOMMA CLUB adotará medidas técnicas e administrativas razoáveis para proteger os dados
            pessoais contra acessos não autorizados, perda, alteração, divulgação indevida, uso
            inadequado ou qualquer forma de tratamento irregular. Os dados poderão ser armazenados em
            servidores próprios ou de terceiros, inclusive provedores de tecnologia, plataformas
            digitais, bancos de dados, ferramentas de automação, sistemas de pagamento, sistemas de
            gestão, serviços em nuvem e demais soluções utilizadas na operação. Os dados serão
            mantidos pelo tempo necessário para cumprir as finalidades deste Termo, obrigações legais,
            regulatórias, fiscais, contratuais, exercício regular de direitos ou interesses legítimos
            do SOMMA CLUB.
          </p>

          <h3 className="text-lg font-semibold text-ink">6. Direitos do titular</h3>
          <p>O titular poderá solicitar, nos termos da legislação aplicável:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Confirmação da existência de tratamento de dados.</li>
            <li>Acesso aos dados pessoais tratados.</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
            <li>
              Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em
              desconformidade.
            </li>
            <li>Portabilidade dos dados, quando aplicável.</li>
            <li>Informações sobre compartilhamento de dados.</li>
            <li>Revogação do consentimento.</li>
            <li>
              Eliminação dos dados tratados com base no consentimento, observadas as hipóteses legais
              de conservação.
            </li>
            <li>Revisão de decisões automatizadas, quando aplicável.</li>
          </ul>
          <p>
            As solicitações poderão ser feitas pelo e-mail:{" "}
            <a href="mailto:sommarunningclub@gmail.com" className="font-medium text-primary underline">
              sommarunningclub@gmail.com
            </a>
            .
          </p>

          <h3 className="text-lg font-semibold text-ink">7. Revogação do consentimento</h3>
          <p>
            O titular poderá revogar este consentimento a qualquer momento, mediante solicitação ao
            SOMMA CLUB. A revogação não invalida os tratamentos realizados anteriormente e poderá
            impactar o acesso a determinados serviços, benefícios, eventos, comunicações, plataformas
            ou funcionalidades que dependam do uso dos dados.
          </p>

          <h3 className="text-lg font-semibold text-ink">8. Dados de menores de idade</h3>
          <p>
            Caso o usuário seja menor de 18 anos, o cadastro, inscrição, participação em eventos, uso
            de imagem e tratamento de dados pessoais deverão ser autorizados por um dos pais ou
            responsável legal. Ao aceitar este Termo em nome de menor de idade, o responsável declara
            possuir poderes para conceder a autorização e responder pelas informações fornecidas.
          </p>

          <h3 className="text-lg font-semibold text-ink">9. Atualizações deste termo</h3>
          <p>
            O SOMMA CLUB poderá atualizar este Termo periodicamente para refletir mudanças legais,
            operacionais, comerciais ou tecnológicas. A versão mais recente estará disponível nos
            canais oficiais do SOMMA CLUB.
          </p>

          <h3 className="text-lg font-semibold text-ink">10. Aceite eletrônico</h3>
          <p>
            Ao marcar a caixa de aceite, clicar em “Aceito”, finalizar cadastro, realizar inscrição,
            efetuar compra, participar de evento, utilizar os serviços ou interagir com os canais do
            SOMMA CLUB, o titular declara que leu, compreendeu e concorda com este Termo de
            Consentimento para Tratamento de Dados Pessoais.
          </p>

          {/* ===== TERMO 2 ===== */}
          <h2 id="uso-de-imagem" className="mt-12 text-2xl font-semibold text-ink">
            2. Termo de Autorização de Uso de Imagem, Voz, Nome e Depoimento
          </h2>
          <p>
            Pelo presente instrumento, o titular autoriza, de forma livre, informada, gratuita e por
            prazo indeterminado, a SOMMA EMPREENDIMENTOS ESPORTIVOS LTDA, inscrita no CNPJ sob o nº
            61.315.987/0001-28, doravante denominada SOMMA CLUB, a captar, utilizar, reproduzir,
            editar, publicar, divulgar e compartilhar sua imagem, voz, nome, apelido, depoimento,
            performance esportiva, participação em eventos, treinos, corridas, ativações, encontros,
            aulas, experiências, bastidores e demais registros realizados em ambientes físicos ou
            digitais relacionados ao SOMMA CLUB.
          </p>
          <p>
            A autorização abrange fotos, vídeos, áudios, entrevistas, prints, stories, transmissões,
            materiais institucionais, publicitários, comerciais, editoriais, jornalísticos,
            educacionais, promocionais e conteúdos para redes sociais, sites, landing pages, anúncios,
            campanhas, apresentações comerciais, propostas para patrocinadores, materiais impressos,
            mídia paga, portfólios, releases, aplicativos, plataformas digitais e demais canais de
            comunicação do SOMMA CLUB e de seus parceiros.
          </p>
          <p>
            O titular autoriza que os materiais possam ser utilizados pelo SOMMA CLUB, seus
            patrocinadores, apoiadores, parceiros comerciais, fornecedores, produtoras, agências,
            veículos de mídia e empresas relacionadas às ações, eventos ou campanhas, sempre vinculados
            à divulgação institucional, comercial, promocional, esportiva ou comunitária do SOMMA CLUB.
          </p>
          <p>
            Esta autorização é concedida em caráter gratuito, sem que seja devido qualquer pagamento,
            indenização, remuneração, compensação ou contraprestação pelo uso da imagem, voz, nome ou
            depoimento, salvo se houver contrato específico em sentido contrário.
          </p>
          <p>
            O titular reconhece que a captação de imagens poderá ocorrer em eventos, treinos, corridas,
            encontros, aulas, ativações, experiências, gravações, fotografias, entrevistas e demais
            ações organizadas ou apoiadas pelo SOMMA CLUB. O SOMMA CLUB poderá editar, adaptar, cortar,
            legendar, sonorizar, combinar com outros conteúdos e adequar os materiais aos formatos
            necessários para divulgação, sem alterar de forma ofensiva ou descontextualizada a imagem
            do titular.
          </p>
          <p>
            A presente autorização é válida no Brasil e no exterior, por prazo indeterminado, para
            utilização em meios físicos, digitais, impressos, audiovisuais, redes sociais, plataformas
            de vídeo, mídia paga, mídia espontânea, apresentações comerciais e demais canais existentes
            ou que venham a existir.
          </p>
          <p>
            O titular poderá solicitar a interrupção do uso futuro de sua imagem em materiais ainda não
            publicados, mediante solicitação formal ao SOMMA CLUB pelo e-mail{" "}
            <a href="mailto:sommarunningclub@gmail.com" className="font-medium text-primary underline">
              sommarunningclub@gmail.com
            </a>
            . A solicitação não obriga a remoção retroativa de materiais já publicados, impressos,
            distribuídos, veiculados, compartilhados por terceiros ou integrados a campanhas já
            executadas.
          </p>
          <p>
            Caso o titular seja menor de 18 anos, este Termo deverá ser aceito por seu pai, mãe ou
            responsável legal, que declara possuir poderes para conceder a presente autorização.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
