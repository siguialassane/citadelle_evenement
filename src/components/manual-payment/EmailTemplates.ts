
// Ce fichier contient les templates d'emails utilisés dans l'application

/**
 * Template d'email pour la notification de paiement manuel à l'administrateur
 * À utiliser avec EmailJS
 */
export const ADMIN_PAYMENT_VALIDATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Demande de validation de paiement</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .validate-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px 20px;
            background-color: #27ae60;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .validate-btn:hover {
            background-color: #219955;
        }
        .payment-details {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .important {
            color: #e74c3c;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Demande de validation de paiement</h1>
        
        <p>Bonjour Administrateur,</p>
        
        <p>Un nouveau paiement manuel vient d'être soumis et nécessite votre vérification.</p>
        
        <div class="payment-details">
            <h3>Détails du participant :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Nom complet :</strong> {{participant_name}}</li>
                <li><strong>Email :</strong> {{participant_email}}</li>
                <li><strong>Téléphone :</strong> {{participant_phone}}</li>
            </ul>
            
            <h3>Détails du paiement :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Montant :</strong> {{payment_amount}}</li>
                <li><strong>Méthode :</strong> {{payment_method}}</li>
                <li><strong>Numéro utilisé :</strong> {{payment_phone}}</li>
                <li><strong>Référence :</strong> <span class="important">{{transaction_reference}}</span></li>
                <li><strong>Date de soumission :</strong> {{current_date}}</li>
            </ul>
            
            <h3>Commentaires :</h3>
            <p>{{comments}}</p>
        </div>
        
        <p><strong>Instructions :</strong> Veuillez vérifier que le paiement a bien été reçu sur le numéro correspondant et que la référence indiquée est correcte avant de valider.</p>
        
        <a href="{{validation_link}}" class="validate-btn">Valider ce paiement</a>
        
        <p style="font-size: 0.9em; text-align: center; margin-top: 30px; color: #7f8c8d;">
            Cet email a été envoyé automatiquement par le système d'inscription IFTAR.<br>
            © La Citadelle 2024. Tous droits réservés.
        </p>
    </div>
</body>
</html>`;

/**
 * Template d'email pour la confirmation de paiement au participant
 * À utiliser avec EmailJS
 */
export const PARTICIPANT_PAYMENT_CONFIRMATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Confirmation de paiement</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .validate-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px 20px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .validate-btn:hover {
            background-color: #2980b9;
        }
        .qr-code {
            display: block;
            width: 150px;
            height: 150px;
            margin: 20px auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Confirmation de paiement</h1>
        
        <p>Bonjour {{prenom}} {{nom}},</p>
        
        <p>Nous sommes ravis de vous confirmer que votre paiement a été validé avec succès. Vous êtes maintenant officiellement inscrit(e) à notre événement.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Vos informations :</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Nom :</strong> {{nom}}</li>
                <li><strong>Prénom :</strong> {{prenom}}</li>
                <li><strong>Email :</strong> {{email}}</li>
                <li><strong>Téléphone :</strong> {{tel}}</li>
                <li><strong>Statut :</strong> {{status}}</li>
            </ul>
        </div>
        
        <p>Voici votre QR code d'accès à l'événement :</p>
        
        <img src="{{qr_code_url}}" alt="QR Code" class="qr-code">
        
        <a href="{{confirmation_url}}" class="validate-btn">Voir ma confirmation</a>
        
        <p>Cet email a été envoyé automatiquement suite à la validation de votre paiement.</p>
        <p>Pour toute question, n'hésitez pas à contacter notre équipe support.</p>
    </div>
</body>
</html>`;
