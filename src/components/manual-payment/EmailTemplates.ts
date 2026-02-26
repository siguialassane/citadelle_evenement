// Ce fichier contient les templates d'emails utilisés dans l'application

/**
 * Template d'email pour la notification de paiement manuel à l'administrateur
 * À utiliser avec EmailJS
 */
export const ADMIN_PAYMENT_VALIDATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouvelle inscription IFTAR 2026</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f9f6; }
        .container { background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-top: 5px solid #07553B; }
        .bismillah { text-align: center; color: #07553B; font-size: 1.2em; margin-bottom: 15px; font-style: italic; }
        .header { text-align: center; padding-bottom: 15px; border-bottom: 1px solid #e0f0e8; margin-bottom: 20px; }
        .header h1 { color: #07553B; font-size: 1.4em; margin: 5px 0; }
        .validate-btn { display: block; width: 220px; margin: 20px auto; padding: 12px 20px; background-color: #07553B; color: white; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; }
        .payment-details { background-color: #f0f9f4; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #07553B; }
        .important { color: #c0392b; font-weight: bold; }
        .footer { text-align: center; margin-top: 25px; font-size: 0.85em; color: #888; border-top: 1px solid #e0f0e8; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div class="header">
            <p style="font-size: 2em; margin: 0;">🌙</p>
            <h1>Nouvelle Inscription — IFTAR 2026</h1>
            <p style="color: #555; margin: 5px 0;">Demande de validation de paiement</p>
        </div>
        <p>Assalamou Aleykoum wa rahmatullahi wa barakatuh,</p>
        <p>Alhamdulillah ! Un(e) nouveau(elle) frère/sœur vient de soumettre sa demande d'inscription à l'<strong>IFTAR 2026</strong>. Merci de vérifier son paiement.</p>
        <div class="payment-details">
            <h3 style="margin-top: 0; color: #07553B;">👤 Informations du participant :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Nom complet :</strong> {{participant_name}}</li>
                <li><strong>Email :</strong> {{participant_email}}</li>
                <li><strong>Téléphone :</strong> {{participant_phone}}</li>
            </ul>
            <h3 style="color: #07553B;">💰 Détails du paiement :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Montant :</strong> {{payment_amount}}</li>
                <li><strong>Méthode :</strong> {{payment_method}}</li>
                <li><strong>Numéro utilisé :</strong> {{payment_phone}}</li>
                <li><strong>Référence :</strong> <span class="important">{{transaction_reference}}</span></li>
                <li><strong>Date de soumission :</strong> {{current_date}}</li>
            </ul>
            <h3 style="color: #07553B;">💬 Commentaires :</h3>
            <p>{{comments}}</p>
        </div>
        <p>Veuillez vérifier que le paiement a bien été reçu et que la référence est correcte avant de valider.</p>
        <a href="{{validation_link}}" class="validate-btn">✔️ Valider ce paiement</a>
        <div class="footer">
            <p>Qu'Allah facilite votre travail et bénisse l'organisation de cet événement.</p>
            <p>Association LA CITADELLE — IFTAR 2026 © Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;

/**
 * Template d'email pour la confirmation de paiement au participant (inscription validée)
 * À utiliser avec EmailJS
 */
export const PARTICIPANT_PAYMENT_CONFIRMATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Votre inscription à l'IFTAR 2026 est confirmée !</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f9f6; }
        .container { background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-top: 5px solid #07553B; }
        .bismillah { text-align: center; color: #07553B; font-size: 1.3em; margin-bottom: 15px; font-style: italic; }
        .header { text-align: center; padding-bottom: 15px; border-bottom: 1px solid #e0f0e8; margin-bottom: 20px; }
        .header h1 { color: #07553B; font-size: 1.5em; margin: 5px 0; }
        .badge-confirmed { display: inline-block; background-color: #07553B; color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.9em; margin: 8px 0; }
        .info-block { background-color: #f0f9f4; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #07553B; }
        .qr-code { display: block; width: 150px; height: 150px; margin: 15px auto; border: 3px solid #07553B; border-radius: 8px; padding: 5px; }
        .cta-btn { display: block; width: 230px; margin: 20px auto; padding: 12px 20px; background-color: #07553B; color: white; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; }
        .hadith { background-color: #fffbe6; border-left: 4px solid #f39c12; padding: 12px 16px; margin: 20px 0; font-style: italic; color: #555; border-radius: 4px; }
        .footer { text-align: center; margin-top: 25px; font-size: 0.85em; color: #888; border-top: 1px solid #e0f0e8; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div class="header">
            <p style="font-size: 2em; margin: 0;">🌙</p>
            <h1>Alhamdulillah ! Inscription confirmée</h1>
            <span class="badge-confirmed">✔️ IFTAR 2026 — 15e Édition</span>
        </div>
        <p>Assalamou Aleykoum wa rahmatullahi wa barakatuh, cher(e) <strong>{{prenom}} {{nom}}</strong>,</p>
        <p>Bonne nouvelle ! Votre paiement a été validé. Vous êtes officiellement inscrit(e) à notre <strong>IFTAR 2026</strong>. Qu'Allah vous récompense pour votre engagement et votre généreux soutien.</p>
        <div class="info-block">
            <h3 style="margin-top: 0; color: #07553B;">🗓️ Détails de l'événement :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li>📍 <strong>Lieu :</strong> NOOM Hôtel Plateau — Abidjan</li>
                <li>📅 <strong>Date :</strong> Dimanche 8 Mars 2026</li>
                <li>⏰ <strong>Heure :</strong> De 16h00 à 21h00</li>
                <li>🎤 <strong>Conférencier :</strong> Imam Cheick Ahmad Tidiane DIABATE</li>
                <li>📖 <strong>Thème :</strong> « Le Coran : Parole incréée, source de guidance divine et de repère pour l'humanité »</li>
            </ul>
            <h3 style="color: #07553B;">👤 Vos informations :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Nom :</strong> {{nom}}</li>
                <li><strong>Prénom :</strong> {{prenom}}</li>
                <li><strong>Email :</strong> {{email}}</li>
                <li><strong>Téléphone :</strong> {{tel}}</li>
                <li><strong>Statut :</strong> {{status}}</li>
            </ul>
        </div>
        <p style="text-align: center; color: #07553B; font-weight: bold;">Votre QR code d'accès :</p>
        <img src="{{qr_code_url}}" alt="QR Code d'accès" class="qr-code">
        <p style="text-align: center; font-size: 0.85em; color: #888;">Présentez ce QR code à l'entrée de l'événement</p>
        <div class="hadith">
            « Celui qui nourrit un jeûneur recevra la même récompense que lui, sans que cela ne diminue en rien la récompense du jeûneur. »
            <br><em>(Hadith rapporté par At-Tirmidhi)</em>
        </div>
        <p>NB : 5 000 FCFA de votre pass seront utilisés pour offrir <strong>5 repas chauds</strong> à des indigents. Qu'Allah multiplie votre récompense.</p>
        <a href="{{app_url}}/confirmation/{{participant_id}}" class="cta-btn">📱 Voir ma confirmation</a>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter au <strong>{{contact_phone}}</strong> ou par email à <strong>{{contact_email}}</strong>.</p>
        <div class="footer">
            <p>Ramadan Moubarak 🌙 Qu'Allah accepte nos jeûnes et nos prières.</p>
            <p>Association LA CITADELLE — IFTAR 2026 © Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;

/**
 * Template d'email pour la notification de paiement en attente au participant
 * À utiliser avec EmailJS pour informer le participant que son paiement est en cours de traitement
 */
export const PARTICIPANT_PAYMENT_PENDING_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Votre inscription est en cours de traitement — IFTAR 2026</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f9f6; }
        .container { background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-top: 5px solid #f39c12; }
        .bismillah { text-align: center; color: #07553B; font-size: 1.3em; margin-bottom: 15px; font-style: italic; }
        .header { text-align: center; padding-bottom: 15px; border-bottom: 1px solid #fdeeba; margin-bottom: 20px; }
        .header h1 { color: #d68910; font-size: 1.4em; margin: 5px 0; }
        .badge-pending { display: inline-block; background-color: #f39c12; color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.9em; }
        .payment-details { background-color: #fffbe6; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12; }
        .pending-btn { display: block; width: 230px; margin: 20px auto; padding: 12px 20px; background-color: #f39c12; color: white; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; }
        .dua { background-color: #f0f9f4; border-left: 4px solid #07553B; padding: 12px 16px; margin: 20px 0; font-style: italic; color: #555; border-radius: 4px; }
        .footer { text-align: center; margin-top: 25px; font-size: 0.85em; color: #888; border-top: 1px solid #fdeeba; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div class="header">
            <p style="font-size: 2em; margin: 0;">⏳</p>
            <h1>Votre inscription est en attente de validation</h1>
            <span class="badge-pending">IFTAR 2026 — 15e Édition</span>
        </div>
        <p>Assalamou Aleykoum wa rahmatullahi wa barakatuh, cher(e) <strong>{{first_name}} {{last_name}}</strong>,</p>
        <p>Barakallahu fik pour votre démarche ! Votre paiement pour l'<strong>IFTAR 2026</strong> a bien été reçu et est en cours de vérification par notre équipe. Qu'Allah facilite les choses pour vous.</p>
        <div class="payment-details">
            <h3 style="margin-top: 0; color: #d68910;">💰 Détails de votre paiement :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Montant :</strong> {{payment_amount}}</li>
                <li><strong>Méthode :</strong> {{payment_method}}</li>
                <li><strong>Numéro utilisé :</strong> {{payment_phone}}</li>
                <li><strong>Référence :</strong> {{transaction_reference}}</li>
                <li><strong>Date :</strong> {{current_date}}</li>
            </ul>
            <h3 style="color: #d68910;">🗓️ L'événement :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li>📍 <strong>Lieu :</strong> NOOM Hôtel Plateau — Abidjan</li>
                <li>📅 <strong>Date :</strong> Dimanche 8 Mars 2026</li>
                <li>⏰ <strong>Heure :</strong> De 16h00 à 21h00</li>
            </ul>
            <h3 style="color: #d68910;">👤 Vos informations :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Nom complet :</strong> {{first_name}} {{last_name}}</li>
                <li><strong>Email :</strong> {{participant_email}}</li>
                <li><strong>Téléphone :</strong> {{participant_phone}}</li>
            </ul>
        </div>
        <div class="dua">
            « Toute action étant liée à l'intention, chacun sera récompensé selon son intention. »
            <br><em>(Hadith rapporté par Al-Bukhari et Muslim)</em>
        </div>
        <p>Votre inscription sera confirmée sous <strong>24 heures</strong> maximum. Vous recevrez un email avec votre QR code d'accès dès validation.</p>
        <a href="{{app_url}}/payment-pending/{{participant_id}}" class="pending-btn">🔍 Suivre mon dossier</a>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter au <strong>{{contact_phone}}</strong> ou par email à <strong>{{contact_email}}</strong>.</p>
        <div class="footer">
            <p>Ramadan Moubarak 🌙 Qu'Allah bénisse votre démarche.</p>
            <p>Association LA CITADELLE — IFTAR 2026 © Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;
