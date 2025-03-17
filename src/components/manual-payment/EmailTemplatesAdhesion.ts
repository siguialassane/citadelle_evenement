
// Templates d'emails pour le processus d'adhésion à l'association LA CITADELLE
// Ces templates sont conçus pour être utilisés avec EmailJS
// Ils contiennent des variables dynamiques qui seront remplacées lors de l'envoi

/**
 * Template d'invitation à l'adhésion pour les participants intéressés
 * Variables: {{prenom}}, {{nom}}, {{app_url}}, etc.
 */
export const ADHESION_INVITATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Invitation à rejoindre LA CITADELLE</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #07553B;
            text-align: center;
            border-bottom: 2px solid #07553B;
            padding-bottom: 10px;
        }
        .action-btn {
            display: block;
            width: 220px;
            margin: 30px auto;
            padding: 14px 20px;
            background-color: #07553B;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .action-btn:hover {
            background-color: #053D2A;
        }
        .greeting {
            font-size: 1.1em;
            margin-bottom: 20px;
        }
        .quote {
            background-color: #f0f7f3;
            border-left: 4px solid #07553B;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .logo {
            display: block;
            width: 120px;
            margin: 0 auto 20px auto;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="{{app_url}}/lovable-uploads/b9ea8b89-890d-460c-b608-1a123b2052a9.png" alt="LA CITADELLE" class="logo">
        <h1>Rejoignez notre Communauté</h1>
        
        <p class="greeting">Assalamou Aleykoum {{prenom}} {{nom}},</p>
        
        <p>Nous espérons que ce message vous trouve en bonne santé et en paix. Suite à votre intérêt pour notre association, nous souhaitons vous inviter officiellement à rejoindre LA CITADELLE en tant que membre actif. 🌙</p>
        
        <div class="quote">
            "Celui qui indique un bien est comme celui qui le fait." (Hadith rapporté par Muslim)
        </div>
        
        <p>En rejoignant LA CITADELLE, vous bénéficierez de:</p>
        <ul>
            <li>Un réseau de frères et sœurs partageant vos valeurs</li>
            <li>Des formations exclusives sur divers aspects de notre religion</li>
            <li>La participation aux projets communautaires enrichissants</li>
            <li>Un accès privilégié à nos événements et conférences</li>
        </ul>
        
        <p>Votre contribution en tant que membre nous aide à organiser des événements comme l'IFTAR annuel et soutient nos actions sociales tout au long de l'année.</p>
        
        <a href="{{app_url}}/membership" class="action-btn">Je souhaite adhérer</a>
        
        <p>Si vous avez des questions sur l'adhésion, n'hésitez pas à nous contacter directement.</p>
        
        <p>Qu'Allah vous accorde Sa bénédiction et Sa guidance.</p>
        
        <div class="footer">
            <p>Association LA CITADELLE</p>
            <p>📱 {{contact_phone}} | 📧 {{contact_email}}</p>
            <p>{{current_year}} © Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

/**
 * Template de notification pour l'administrateur lors d'une nouvelle demande d'adhésion
 * Variables: {{admin_name}}, {{participant_name}}, {{admin_url}}, etc.
 */
export const ADMIN_ADHESION_NOTIFICATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouvelle demande d'adhésion</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #07553B;
            text-align: center;
            border-bottom: 2px solid #07553B;
            padding-bottom: 10px;
        }
        .action-btn {
            display: block;
            width: 220px;
            margin: 30px auto;
            padding: 14px 20px;
            background-color: #07553B;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .action-btn:hover {
            background-color: #053D2A;
        }
        .member-details {
            background-color: #f0f7f3;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .logo {
            display: block;
            width: 120px;
            margin: 0 auto 20px auto;
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            background-color: #ff9800;
            color: white;
            border-radius: 15px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="{{app_url}}/lovable-uploads/b9ea8b89-890d-460c-b608-1a123b2052a9.png" alt="LA CITADELLE" class="logo">
        <h1>Nouvelle demande d'adhésion <span class="badge">Action requise</span></h1>
        
        <p>Assalamou Aleykoum {{admin_name}},</p>
        
        <p>Une nouvelle demande d'adhésion vient d'être soumise sur le site de LA CITADELLE. Voici les détails:</p>
        
        <div class="member-details">
            <h3 style="margin-top: 0;">Informations du demandeur:</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Nom complet:</strong> {{participant_name}}</li>
                <li><strong>Email:</strong> {{participant_email}}</li>
                <li><strong>Téléphone:</strong> {{participant_phone}}</li>
                <li><strong>Profession:</strong> {{participant_profession}}</li>
                <li><strong>Date de demande:</strong> {{submission_date}}</li>
            </ul>
            
            <h3>Détails de l'adhésion:</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Montant:</strong> {{payment_amount}}</li>
                <li><strong>Périodicité:</strong> {{payment_frequency}}</li>
                <li><strong>Méthode de paiement:</strong> {{payment_method}}</li>
            </ul>
            
            <p><strong>Attentes:</strong> {{club_expectations}}</p>
        </div>
        
        <p>Merci de valider ou refuser cette demande via le dashboard administrateur.</p>
        
        <a href="{{admin_url}}/admin/membership" class="action-btn">Gérer cette demande</a>
        
        <div class="footer">
            <p>Cette notification a été envoyée automatiquement par le système d'adhésion de LA CITADELLE.</p>
            <p>{{current_year}} © Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

/**
 * Template de confirmation et félicitations pour un nouveau membre
 * Variables: {{prenom}}, {{nom}}, {{membership_id}}, etc.
 */
export const ADHESION_CONFIRMATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bienvenue à LA CITADELLE</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #07553B;
            text-align: center;
            border-bottom: 2px solid #07553B;
            padding-bottom: 10px;
        }
        .celebrate {
            font-size: 3em;
            text-align: center;
            margin: 20px 0;
        }
        .membership-card {
            border: 2px solid #07553B;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            background-color: #f0f7f3;
            position: relative;
            overflow: hidden;
        }
        .membership-card::after {
            content: "LA CITADELLE";
            position: absolute;
            bottom: -15px;
            right: -5px;
            font-size: 60px;
            opacity: 0.05;
            transform: rotate(-15deg);
            font-weight: bold;
        }
        .membership-id {
            font-family: monospace;
            letter-spacing: 1px;
            font-weight: bold;
            display: block;
            text-align: center;
            font-size: 1.2em;
            margin: 15px 0;
            color: #07553B;
        }
        .action-btn {
            display: block;
            width: 220px;
            margin: 30px auto;
            padding: 14px 20px;
            background-color: #07553B;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .action-btn:hover {
            background-color: #053D2A;
        }
        .quote {
            background-color: #f0f7f3;
            border-left: 4px solid #07553B;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .logo {
            display: block;
            width: 120px;
            margin: 0 auto 20px auto;
        }
        .benefits {
            background-color: #f0f7f3;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="{{app_url}}/lovable-uploads/b9ea8b89-890d-460c-b608-1a123b2052a9.png" alt="LA CITADELLE" class="logo">
        <h1>Félicitations et Bienvenue! 🎉</h1>
        
        <div class="celebrate">🌙 ✨ 🌙</div>
        
        <p>Assalamou Aleykoum {{prenom}} {{nom}},</p>
        
        <p>Nous avons le plaisir de vous annoncer que <strong>votre demande d'adhésion à l'association LA CITADELLE a été acceptée!</strong> Nous sommes ravis de vous accueillir parmi notre communauté de membres engagés.</p>
        
        <div class="membership-card">
            <h3 style="text-align: center; margin-top: 0;">Carte de Membre</h3>
            <p style="text-align: center;"><strong>{{prenom}} {{nom}}</strong></p>
            <p class="membership-id">Membre №: {{membership_id}}</p>
            <p style="text-align: center; margin-bottom: 0;">Adhésion valable jusqu'au: {{expiry_date}}</p>
        </div>
        
        <div class="quote">
            "Les croyants, dans leur affection, leur tendresse et leur compassion mutuelles, sont comme un corps; lorsqu'un membre souffre, tout le corps partage sa fièvre et son insomnie." (Hadith rapporté par Al-Bukhari et Muslim)
        </div>
        
        <div class="benefits">
            <h3 style="margin-top: 0;">Vos avantages en tant que membre:</h3>
            <ul>
                <li>Accès prioritaire à tous nos événements</li>
                <li>Participation à nos programmes de formation</li>
                <li>Possibilité de contribuer activement à nos projets</li>
                <li>Réseautage avec d'autres membres partageant vos valeurs</li>
                <li>Invitations aux rencontres exclusives de membres</li>
            </ul>
        </div>
        
        <p>Notre prochain événement réservé aux membres aura lieu le <strong>{{next_event_date}}</strong>. Un email d'invitation vous sera envoyé prochainement avec tous les détails.</p>
        
        <a href="{{app_url}}/member-portal" class="action-btn">Accéder à mon espace membre</a>
        
        <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe à <a href="mailto:{{contact_email}}">{{contact_email}}</a>.</p>
        
        <p>Qu'Allah guide nos pas et bénisse notre association.</p>
        
        <div class="footer">
            <p>Association LA CITADELLE</p>
            <p>📱 {{contact_phone}} | 📧 {{contact_email}}</p>
            <p>{{current_year}} © Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

/**
 * Template pour informer le participant que sa demande est en cours d'étude
 * Variables: {{prenom}}, {{nom}}, {{app_url}}, etc.
 */
export const ADHESION_PENDING_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Demande d'adhésion en cours d'étude</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #07553B;
            text-align: center;
            border-bottom: 2px solid #07553B;
            padding-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            background-color: #f39c12;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin: 15px auto;
            text-align: center;
        }
        .status-container {
            text-align: center;
        }
        .quote {
            background-color: #f0f7f3;
            border-left: 4px solid #07553B;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .logo {
            display: block;
            width: 120px;
            margin: 0 auto 20px auto;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
        }
        .timeline {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            position: relative;
        }
        .timeline::before {
            content: '';
            position: absolute;
            background-color: #e0e0e0;
            height: 2px;
            width: 100%;
            top: 15px;
            z-index: 1;
        }
        .timeline-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            z-index: 2;
        }
        .step-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: white;
            border: 2px solid #e0e0e0;
        }
        .step-icon.active {
            background-color: #07553B;
            color: white;
            border-color: #07553B;
        }
        .step-text {
            margin-top: 10px;
            text-align: center;
            font-size: 0.8em;
            width: 80px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="{{app_url}}/lovable-uploads/b9ea8b89-890d-460c-b608-1a123b2052a9.png" alt="LA CITADELLE" class="logo">
        <h1>Demande d'adhésion reçue</h1>
        
        <p>Assalamou Aleykoum {{prenom}} {{nom}},</p>
        
        <p>Nous vous confirmons que votre demande d'adhésion à l'association LA CITADELLE a bien été reçue et est actuellement en cours d'étude par notre équipe.</p>
        
        <div class="status-container">
            <span class="status-badge">Demande en cours d'étude</span>
        </div>
        
        <div class="timeline">
            <div class="timeline-step">
                <div class="step-icon active">✓</div>
                <div class="step-text">Demande reçue</div>
            </div>
            <div class="timeline-step">
                <div class="step-icon active">⟳</div>
                <div class="step-text">En cours d'étude</div>
            </div>
            <div class="timeline-step">
                <div class="step-icon">✓</div>
                <div class="step-text">Décision</div>
            </div>
        </div>
        
        <p>Nous allons examiner votre dossier dans les meilleurs délais. Vous recevrez un email de confirmation dès que votre demande aura été traitée.</p>
        
        <div class="quote">
            "La patience est la clé du soulagement." (Hadith)
        </div>
        
        <p>Voici un récapitulatif de votre demande:</p>
        <ul>
            <li><strong>Nom:</strong> {{nom}}</li>
            <li><strong>Prénom:</strong> {{prenom}}</li>
            <li><strong>Email:</strong> {{email}}</li>
            <li><strong>Téléphone:</strong> {{contact_number}}</li>
            <li><strong>Montant de souscription:</strong> {{subscription_amount}}</li>
            <li><strong>Périodicité:</strong> {{payment_frequency}}</li>
            <li><strong>Date de demande:</strong> {{requested_date}}</li>
        </ul>
        
        <p>Si vous avez des questions ou souhaitez modifier certaines informations de votre demande, n'hésitez pas à nous contacter.</p>
        
        <p>Qu'Allah vous accorde patience et sagesse.</p>
        
        <div class="footer">
            <p>Association LA CITADELLE</p>
            <p>📱 {{contact_phone}} | 📧 {{contact_email}}</p>
            <p>{{current_year}} © Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

/**
 * Template pour informer le participant que sa demande d'adhésion a été rejetée
 * Variables: {{prenom}}, {{nom}}, {{rejection_reason}}, etc.
 */
export const ADHESION_REJECTION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Réponse à votre demande d'adhésion</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #07553B;
            text-align: center;
            border-bottom: 2px solid #07553B;
            padding-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            background-color: #e74c3c;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin: 15px auto;
            text-align: center;
        }
        .status-container {
            text-align: center;
        }
        .action-btn {
            display: block;
            width: 220px;
            margin: 30px auto;
            padding: 14px 20px;
            background-color: #07553B;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .action-btn:hover {
            background-color: #053D2A;
        }
        .quote {
            background-color: #f0f7f3;
            border-left: 4px solid #07553B;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .logo {
            display: block;
            width: 120px;
            margin: 0 auto 20px auto;
        }
        .reason-box {
            background-color: #f8f5f5;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="{{app_url}}/lovable-uploads/b9ea8b89-890d-460c-b608-1a123b2052a9.png" alt="LA CITADELLE" class="logo">
        <h1>Réponse à votre demande d'adhésion</h1>
        
        <p>Assalamou Aleykoum {{prenom}} {{nom}},</p>
        
        <p>Nous avons bien étudié votre demande d'adhésion à l'association LA CITADELLE.</p>
        
        <div class="status-container">
            <span class="status-badge">Demande non retenue</span>
        </div>
        
        <p>Après examen attentif de votre candidature, nous sommes au regret de vous informer que nous ne pouvons pas donner suite favorable à votre demande d'adhésion à ce stade.</p>
        
        <div class="reason-box">
            <h3>Motif:</h3>
            <p>{{rejection_reason}}</p>
        </div>
        
        <div class="quote">
            "Dans chaque épreuve se trouve une opportunité de croissance." (Réflexion islamique)
        </div>
        
        <p>Cette décision ne remet nullement en cause vos qualités personnelles. Nous vous encourageons à participer à nos activités ouvertes au public et à rester en contact avec notre communauté.</p>
        
        <a href="{{app_url}}/events" class="action-btn">Découvrir nos événements</a>
        
        <p>Si vous avez des questions, n'hésitez pas à nous contacter. Nous vous remercions de l'intérêt que vous portez à notre association.</p>
        
        <p>Qu'Allah vous guide et vous accorde Sa bénédiction.</p>
        
        <div class="footer">
            <p>Association LA CITADELLE</p>
            <p>📱 {{contact_phone}} | 📧 {{contact_email}}</p>
            <p>{{current_year}} © Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

