import functions_framework
from google.cloud import bigquery
import json
from flask import make_response

@functions_framework.http
def getMajeur(request):
    """
    Fonction HTTP Cloud qui interroge BigQuery et retourne les défauts majeurs.
    """
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        request_json = request.get_json(silent=True)
        num = request_json.get('Num') if request_json else None

        if num is None:
            return (json.dumps({"erreur": "Le paramètre 'Num' est manquant."}), 400, headers)

        client = bigquery.Client()
        
        # Corrected: Use a parameterized query with @num
        query = """
            SELECT *
            FROM `batiment-dirif.vizissuni.grav_ferm_date_rps`
            WHERE `Gravité` = "Défaut majeur" AND otPereId = @num
        """
        
        # Corrected: Pass the parameter in the query configuration
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("num", "STRING", num),
            ]
        )
        
        query_job = client.query(query, job_config=job_config)
        results = query_job.result()
        
        # Convert rows to a list of dictionaries
        rows = [dict(row) for row in results]

        # Ensure all data types are JSON serializable (e.g., dates)
        for row in rows:
            for key, value in row.items():
                if hasattr(value, 'isoformat'):
                    row[key] = value.isoformat()

        response_data = json.dumps(rows)
        response = make_response(response_data)
        response.headers['Content-Type'] = 'application/json'
        
        for key, value in headers.items():
            response.headers[key] = value
            
        return response

    except Exception as e:
        return (json.dumps({"erreur": str(e)}), 500, headers)