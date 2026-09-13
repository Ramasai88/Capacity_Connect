# scripts/generate_ml_py_sql.py
import json
import os
import re

CURRICULUM_DIR = os.path.join(os.path.dirname(__file__), "..", "lib", "demo", "curriculum")

def save_curriculum_file(filename, var_name, data):
    filepath = os.path.join(CURRICULUM_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write('import { CourseCurriculum } from "./types";\n\n')
        f.write(f'export const {var_name}: CourseCurriculum = ')
        f.write(json.dumps(data, indent=2, ensure_ascii=False))
        f.write(';\n')
    print(f"[OK] Saved {filename} ({len(data['modules'])} modules)")

def read_curriculum_file(filename):
    filepath = os.path.join(CURRICULUM_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r'export const (\w+): CourseCurriculum = ({[\s\S]+});', content)
    if not match:
        raise ValueError(f"Could not parse {filename}")
    var_name = match.group(1)
    data = json.loads(match.group(2))
    return var_name, data

# ==============================================================================
# 2. MACHINE LEARNING FUNDAMENTALS (course-ml-402.ts) - 11 Modules
# ==============================================================================
def process_ml():
    var_name, data = read_curriculum_file("course-ml-402.ts")
    
    ml_lessons = [
        # Mod 1: Foundations & Problem Framing
        [
            ("ML Problem Framing", "Supervised vs Unsupervised Formulation & The Bias-Variance Tradeoff",
             "Formulating business objectives into supervised learning targets, balancing underfitting (high bias) against overfitting (high variance).",
             "Determines model architecture choice, data requirements, and prevents building the wrong model for the problem.",
             "High bias models make overly simplistic assumptions (underfit); high variance models memorize training noise and fail on unseen validation data.",
             ["1. Identify business objective and target metric (RMSE, ROC-AUC, F1).", "2. Map features X and target vector y.", "3. Split data into Stratified Train/Val/Test partitions (e.g. 70/15/15).", "4. Plot learning curves (Training vs Validation loss across sample sizes)."],
             "Predicting Employee Churn:\nFeatures: [tenure_months, performance_rating, commute_distance]\nTarget label: is_churned (0 or 1)\nPartition: 80% Train, 20% Test (Stratified by churn class ratio).",
             "Used across enterprise risk scoring, customer lifetime value, and fraud detection systems.",
             "from sklearn.model_selection import train_test_split\nimport numpy as np\n\nX = np.random.randn(1000, 10)\ny = np.random.randint(0, 2, 1000)\n\n# Stratified splitting prevents data leakage and preserves class distribution\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)\nprint(f'Train samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}')",
             "1. `stratify=y` ensures minority class proportions are identical in train and test sets.\n2. `random_state=42` guarantees deterministic reproducibility.",
             "Train samples: 800, Test samples: 200",
             "Fitting scalers or imputation transformers before splitting data, leaking test distribution information into the training set.",
             "Plot learning curves for a decision tree with varying max_depth (1 to 20) and identify where overfitting begins.",
             "The bias-variance tradeoff guides whether to increase model complexity or gather more data and regularization.")
        ],
        # Mod 2: Exploratory Data Analysis & Feature Engineering
        [
            ("Feature Transformation", "Scikit-Learn ColumnTransformer & Feature Pipelines",
             "Systematic preprocessing of heterogeneous data: handling missing values with median/KNN imputation, scaling numerical features, and encoding categorical variables.",
             "Raw real-world data contains missing values, outliers, and text categories that crash mathematical ML estimators.",
             "ColumnTransformer applies distinct transformation pipelines to designated numerical and categorical column subsets without leakage.",
             ["1. Identify numerical vs categorical column lists.", "2. Build numerical Pipeline with SimpleImputer + StandardScaler.", "3. Build categorical Pipeline with SimpleImputer + OneHotEncoder.", "4. Combine inside ColumnTransformer."],
             "Raw Row: {'age': 32, 'salary': None, 'department': 'Engineering'}\nTransformed Vector: [0.45, 0.00 (imputed median), 1.0 (is_eng), 0.0 (is_sales), 0.0 (is_hr)]",
             "Standard data preparation workflow across Kaggle competitions and production Scikit-Learn deployments.",
             "from sklearn.compose import ColumnTransformer\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.impute import SimpleImputer\nfrom sklearn.preprocessing import StandardScaler, OneHotEncoder\nimport pandas as pd\n\nnum_pipe = Pipeline([('impute', SimpleImputer(strategy='median')), ('scale', StandardScaler())])\ncat_pipe = Pipeline([('impute', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore'))])\n\npreprocessor = ColumnTransformer([\n    ('num', num_pipe, ['age', 'tenure']),\n    ('cat', cat_pipe, ['department'])\n])\nprint('Configured robust multi-type ColumnTransformer pipeline.')",
             "1. `SimpleImputer` resolves null values.\n2. `OneHotEncoder(handle_unknown='ignore')` prevents inference crashes when unseen categories appear.",
             "Configured robust multi-type ColumnTransformer pipeline.",
             "Using `fit_transform` on the test set instead of `transform`, invalidating test set evaluation.",
             "Create a custom Scikit-learn transformer that calculates log-transforms on heavily skewed financial features.",
             "ColumnTransformer encapsulates all preprocessing transformations into a single leak-free deployable estimator.")
        ],
        # Mod 3: Linear Regression & Regularization
        [
            ("Linear Modeling & Regularization", "Ridge (L2) vs Lasso (L1) & ElasticNet",
             "Linear regression with regularization penalties: Ridge (L2 weight decay) and Lasso (L1 sparsity selection) to prevent multicollinearity and overfitting.",
             "Ordinary Least Squares (OLS) produces erratic, massive coefficients when features are correlated or noisy.",
             "Ridge adds alpha * sum(w_i^2) shrinking weights toward zero; Lasso adds alpha * sum(|w_i|) driving non-informative feature weights to exactly zero.",
             ["1. Scale all features to zero mean and unit variance.", "2. Formulate objective: Loss = MSE + Regularization penalty.", "3. Tune hyperparameter alpha using Cross-Validation.", "4. Evaluate coefficient magnitudes."],
             "OLS Coefficients: [450.2, -890.1, 1200.5] (Unstable)\nRidge (alpha=10.0): [24.1, -18.3, 31.0] (Stable, generalized)\nLasso (alpha=5.0): [22.0, 0.0, 29.5] (Zeroed out redundant feature #2)",
             "Used in econometric forecasting, risk sensitivity models, and automated feature selection.",
             "from sklearn.linear_model import Ridge, Lasso\nimport numpy as np\n\nX = np.random.randn(100, 5)\ny = 2 * X[:, 0] + 0.5 * X[:, 1] + np.random.randn(100) * 0.1\n\nridge = Ridge(alpha=1.0).fit(X, y)\nlasso = Lasso(alpha=0.1).fit(X, y)\nprint('Ridge Weights:', np.round(ridge.coef_, 2))\nprint('Lasso Weights (Sparsity enabled):', np.round(lasso.coef_, 2))",
             "1. `Ridge(alpha=1.0)` shrinks weights smoothly.\n2. `Lasso(alpha=0.1)` sets weak feature coefficients to exactly 0.0.",
             "Ridge Weights: [1.95 0.48 0.02 -0.01 0.01]\nLasso Weights (Sparsity enabled): [1.88 0.39 0.   0.  -0.  ]",
             "Failing to standardize features before applying L1/L2 regularization; features with larger scales get penalized unfairly.",
             "Implement ElasticNet regression and compare its performance against pure Lasso on a multicollinear dataset.",
             "Regularization constrains model complexity, prevents overfitting, and stabilizes linear models against multicollinearity.")
        ],
        # Mod 4: Classification & Logistic Modeling
        [
            ("Probabilistic Classification", "Logistic Regression & Decision Boundaries",
             "Modeling binary class probabilities using the sigmoid function: P(y=1|x) = 1 / (1 + exp(-z)), optimized via binary cross-entropy loss.",
             "Unlike linear regression, logistic regression guarantees output values strictly bounded in [0.0, 1.0], representing true class probabilities.",
             "Computes linear combination z = w^T * x + b, passes through sigmoid activation, and thresholds at 0.5 (or a custom threshold).",
             ["1. Compute log-odds z = w_1*x_1 + ... + w_n*x_n + b.", "2. Transform log-odds to probability p via Sigmoid.", "3. Calculate Binary Cross-Entropy (Log-Loss).", "4. Optimize weights using L-BFGS or SGD."],
             "Log-odds z = 2.197 -> Sigmoid(2.197) = 1 / (1 + e^-2.197) = 0.90 (90% probability of positive class).",
             "Credit card fraud scoring, medical diagnosis probability, and conversion rate prediction.",
             "from sklearn.linear_model import LogisticRegression\nimport numpy as np\n\nX = np.array([[1.0], [2.0], [3.0], [8.0], [9.0], [10.0]])\ny = np.array([0, 0, 0, 1, 1, 1])\n\nclf = LogisticRegression().fit(X, y)\nprob = clf.predict_proba([[4.0]])[0]\nprint(f'Probability of Class 0: {prob[0]:.2%}, Class 1: {prob[1]:.2%}')",
             "1. `predict_proba()` returns exact calibrated class probabilities.\n2. Decision threshold can be tuned to maximize Recall or Precision.",
             "Probability of Class 0: 84.12%, Class 1: 15.88%",
             "Using default 0.5 decision threshold on highly imbalanced datasets (e.g. 99% negative class), causing zero true positive detections.",
             "Adjust the decision threshold from 0.1 to 0.9 and plot the resulting Precision-Recall curve.",
             "Logistic regression provides interpretable log-odds and calibrated probabilities for binary and multinomial classification.")
        ],
        # Mod 5: Tree-Based Methods & Random Forests
        [
            ("Ensemble Learning", "Random Forests & Bagging Mechanics",
             "Ensemble learning combining hundreds of randomized decision trees via bootstrap aggregation (Bagging) to drastically reduce variance.",
             "Single decision trees have high variance and overfit rapidly; aggregating diverse trees creates robust, accurate classifiers.",
             "Each tree trains on a bootstrap sample of data and considers only a random subset of features (e.g. sqrt(p)) at each split.",
             ["1. Generate B bootstrap datasets with replacement.", "2. Train unpruned decision tree on each bootstrap sample with random feature subsets.", "3. Aggregate predictions: majority vote for classification, average for regression.", "4. Compute Out-of-Bag (OOB) generalization error."],
             "Individual Tree Accuracies: [78%, 81%, 76%, 83%, 79%]\nEnsemble Majority Vote Accuracy: 89.5% (Variance cancelled out!).",
             "Used across financial credit underwriting, tabular feature ranking, and medical patient risk analysis.",
             "from sklearn.ensemble import RandomForestClassifier\nimport numpy as np\n\nX = np.random.randn(200, 5)\ny = (X[:, 0] + X[:, 1] > 0).astype(int)\n\nrf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, oob_score=True)\nrf.fit(X, y)\nprint(f'Out-of-Bag Generalization Score: {rf.oob_score_:.4f}')\nprint('Feature Importances:', np.round(rf.feature_importances_, 3))",
             "1. `n_estimators=100` trains 100 decorrelated trees.\n2. `oob_score=True` calculates validation score without needing a separate validation split.",
             "Out-of-Bag Generalization Score: 0.9100\nFeature Importances: [0.462 0.441 0.035 0.031 0.031]",
             "Setting max_depth=None on noisy datasets with many trees, leading to massive memory consumption and slow inference.",
             "Extract and plot MDI (Mean Decrease in Impurity) vs Permutation Feature Importance for a Random Forest model.",
             "Random Forests reduce model variance through bootstrap aggregation and random feature sub-spacing.")
        ],
        # Mod 6: Gradient Boosting Systems
        [
            ("Boosting Algorithms", "Gradient Boosting (XGBoost, LightGBM & CatBoost)",
             "Sequential ensemble learning where each new tree is trained to predict the pseudo-residuals (negative gradient of the loss function) of previous trees.",
             "Gradient boosting is the undisputed state-of-the-art architecture for structured tabular datasets.",
             "Unlike bagging (parallel), boosting builds trees sequentially: y_pred_m = y_pred_{m-1} + learning_rate * Tree_m(residuals).",
             ["1. Initialize model with constant prediction (e.g. log-odds base rate).", "2. Calculate negative gradient (residual) for each sample.", "3. Fit shallow decision tree to residuals.", "4. Multiply tree output by learning rate (shrinkage) and add to ensemble.", "5. Stop early when validation metric ceases to improve."],
             "Residual Step:\nActual: 100, Base Pred: 70 -> Residual: +30\nTree 1 predicts +20 (scaled by lr 0.1 = +2) -> New Pred: 72 -> Residual: +28\nIterates until residuals approach zero.",
             "Winning algorithm on 85%+ of tabular Kaggle competitions and core to Uber ETAs and Netflix recommendations.",
             "from sklearn.ensemble import HistGradientBoostingClassifier\nimport numpy as np\n\nX = np.random.randn(500, 8)\ny = (X[:, 0] * X[:, 1] > 0).astype(int)\n\ngb = HistGradientBoostingClassifier(max_iter=50, learning_rate=0.08, random_state=42)\ngb.fit(X, y)\nprint(f'Trained Gradient Boosting Ensemble with score: {gb.score(X, y):.4f}')",
             "1. `HistGradientBoostingClassifier` uses binned histograms (similar to LightGBM) for fast execution.\n2. `learning_rate=0.08` prevents overfitting by shrinking individual tree contributions.",
             "Trained Gradient Boosting Ensemble with score: 0.9420",
             "Setting learning rate too high without early stopping, resulting in severe overfitting on residual noise.",
             "Train an XGBoost model and compare training time and AUC against standard Random Forest.",
             "Gradient boosting sequentially minimizes residual errors, delivering industry-leading accuracy on tabular datasets.")
        ],
        # Mod 7: Unsupervised Learning & Dimensionality Reduction
        [
            ("Unsupervised Clustering", "K-Means Clustering & Principal Component Analysis (PCA)",
             "Partitioning unlabeled data into k clusters by minimizing inertia (within-cluster sum of squares), and reducing feature dimensions via PCA orthogonal eigenvectors.",
             "Discovers latent customer segments and compresses high-dimensional feature spaces without supervision.",
             "K-Means alternates between assigning points to nearest centroids and updating centroids to the mean of assigned points. PCA projects data onto directions of maximum variance.",
             ["1. Standardize features to zero mean and unit variance.", "2. Select k using the Elbow Method and Silhouette Analysis.", "3. Iterate centroid assignments until convergence.", "4. Apply PCA to project data to 2-3 components for visual inspection."],
             "Customer Spending Data (10 features) -> PCA reduces to 2 Principal Components explaining 88% of total variance -> K-Means finds 3 clear clusters: Budget, Loyal, Enterprise.",
             "Customer segmentation, anomaly detection, genomic sequence clustering, and image compression.",
             "from sklearn.cluster import KMeans\nfrom sklearn.decomposition import PCA\nimport numpy as np\n\nX = np.random.randn(300, 6)\n\n# Dimensionality Reduction\npca = PCA(n_components=2)\nX_pca = pca.fit_transform(X)\n\n# Clustering\nkmeans = KMeans(n_clusters=3, random_state=42, n_init='auto').fit(X_pca)\nprint(f'PCA Explained Variance Ratio: {pca.explained_variance_ratio_.sum():.2%}')\nprint(f'Assigned Cluster Labels: {np.unique(kmeans.labels_)}')",
             "1. `PCA(n_components=2)` projects 6D data to 2D preserving maximum variance.\n2. `KMeans` clusters the projected data points.",
             "PCA Explained Variance Ratio: 45.12%\nAssigned Cluster Labels: [0 1 2]",
             "Failing to standardize features before K-Means, causing features with large scales to dominate distance calculations.",
             "Compute Silhouette Scores for k=2 to k=8 on a customer dataset to determine the mathematically optimal cluster count.",
             "PCA compresses feature spaces by projecting along maximum variance axes, while K-Means groups geometrically cohesive clusters.")
        ],
        # Mod 8: Model Evaluation & Validation
        [
            ("Validation Strategy", "Cross-Validation, ROC-AUC & Precision-Recall Curves",
             "Rigorous performance evaluation using Stratified K-Fold cross-validation, Confusion Matrices, ROC-AUC, and Precision-Recall tradeoffs.",
             "Accuracy is dangerously misleading on imbalanced datasets (e.g. predicting 0 for 99% negative class yields 99% accuracy but 0% utility).",
             "ROC-AUC measures discrimination across all thresholds; PR-AUC focuses on minority positive class detection.",
             ["1. Partition data into 5 Stratified K-Folds.", "2. Fit estimator on 4 folds, evaluate on held-out fold.", "3. Average validation metrics across all 5 iterations.", "4. Generate Precision-Recall curve to pick production operating threshold."],
             "Imbalanced Fraud Dataset (1% Fraud):\n- Dummy Accuracy: 99.0%, ROC-AUC: 0.50, Recall: 0.0%\n- Tuned Model: Accuracy: 98.2%, ROC-AUC: 0.94, Recall: 86.5%",
             "Mandatory evaluation standard in enterprise ML governance, medical models, and financial scoring.",
             "from sklearn.metrics import classification_report, roc_auc_score\nimport numpy as np\n\ny_true = np.array([0, 1, 0, 0, 1, 1, 0, 1])\ny_pred_prob = np.array([0.1, 0.9, 0.2, 0.3, 0.8, 0.65, 0.05, 0.75])\ny_pred = (y_pred_prob >= 0.5).astype(int)\n\nprint('Classification Report:\\n', classification_report(y_true, y_pred))\nprint(f'ROC-AUC Score: {roc_auc_score(y_true, y_pred_prob):.4f}')",
             "1. `classification_report` displays Precision, Recall, and F1 per class.\n2. `roc_auc_score` evaluates probabilistic ranking quality.",
             "Classification Report:\n               precision    recall  f1-score   support\n           0       1.00      1.00      1.00         4\n           1       1.00      1.00      1.00         4\n    accuracy                           1.00         8\n\nROC-AUC Score: 1.0000",
             "Evaluating models using standard K-Fold instead of Stratified K-Fold when target classes are imbalanced.",
             "Implement a cost-benefit matrix function that calculates business dollar profit across varying classification thresholds.",
             "Stratified K-Fold and Precision-Recall metrics provide true visibility into classifier generalization on real-world data.")
        ],
        # Mod 9: Hyperparameter Optimization
        [
            ("Tuning Strategies", "Bayesian Optimization with Optuna vs Random Search",
             "Automated hyperparameter tuning using Bayesian Optimization (Tree-structured Parzen Estimator) to efficiently locate optimal configurations.",
             "Grid search suffers from combinatorial explosion; manual tuning is time-consuming and sub-optimal.",
             "Bayesian optimization models the objective function probability distribution, focusing search on high-performing parameter regions.",
             ["1. Define search space (learning_rate, max_depth, l2_reg).", "2. Optuna samples trials based on historical performance.", "3. Apply pruning to terminate unpromising trials early.", "4. Extract best trial parameters."],
             "Grid Search (1000 combinations) = 12 hours.\nOptuna Bayesian Search (50 trials with pruning) = 22 minutes (matching or exceeding grid search accuracy).",
             "Used in automated ML pipelines at Google, Uber, Meta, and modern MLOps platforms.",
             "from sklearn.model_selection import RandomizedSearchCV\nfrom sklearn.ensemble import RandomForestClassifier\nimport numpy as np\n\nparam_dist = {'n_estimators': [50, 100, 150], 'max_depth': [3, 5, 10, None]}\nX = np.random.randn(100, 4)\ny = np.random.randint(0, 2, 100)\n\nsearch = RandomizedSearchCV(RandomForestClassifier(random_state=42), param_dist, n_iter=4, cv=3, random_state=42)\nsearch.fit(X, y)\nprint('Best Parameters:', search.best_params_)",
             "1. `RandomizedSearchCV` samples parameter distributions randomly.\n2. `cv=3` validates performance on 3 internal cross-validation folds.",
             "Best Parameters: {'n_estimators': 100, 'max_depth': 5}",
             "Tuning hyperparameters on the test set, creating optimistic bias and invalidating performance estimates.",
             "Write an Optuna study with early stopping pruner (`MedianPruner`) to tune an XGBoost model.",
             "Bayesian optimization finds optimal hyperparameter configurations with a fraction of the computational budget of grid search.")
        ],
        # Mod 10: ML Pipelines & Scikit-Learn Architecture
        [
            ("Pipeline Engineering", "Production Pipeline Serialization & Validation",
             "Building unified Scikit-learn Pipelines combining data transformers, scalers, and estimators into a single atomic object, serialized with Joblib.",
             "Prevents training-serving skew, guarantees preprocessing reproducibility, and simplifies production deployment.",
             "The Pipeline object chains `fit()` and `transform()` across all steps and exposes a single unified `predict()` API.",
             ["1. Assemble transformers into Pipeline.", "2. Fit entire pipeline on training data in one command.", "3. Evaluate on test data via `pipeline.predict(X_test)`.", "4. Save pipeline to disk via `joblib.dump()`."],
             "Raw Input Request -> Pipeline(Imputer -> Scaler -> Model) -> Output Prediction (Atomic execution in <5ms).",
             "Industry standard deployment format for tabular ML microservices.",
             "from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nimport joblib\nimport numpy as np\n\npipe = Pipeline([\n    ('scaler', StandardScaler()),\n    ('classifier', LogisticRegression())\n])\n\nX = np.random.randn(50, 3)\ny = np.random.randint(0, 2, 50)\npipe.fit(X, y)\n\n# Persist artifact\njoblib.dump(pipe, 'model_pipeline.joblib')\nprint('Saved atomic ML pipeline artifact successfully.')",
             "1. `pipe.fit(X, y)` standardizes data and fits the classifier atomically.\n2. `joblib.dump` serializes the fitted pipeline for deployment.",
             "Saved atomic ML pipeline artifact successfully.",
             "Deploying raw models without the corresponding preprocessing transformer, causing serving crashes on raw production payloads.",
             "Build a custom Transformer class inheriting from `BaseEstimator` and `TransformerMixin` and include it in a pipeline.",
             "Packaging preprocessing and modeling into an atomic Scikit-learn Pipeline eliminates training-serving skew.")
        ],
        # Mod 11: Production Deployment & Capstone
        [
            ("ML Productionization", "FastAPI Serving, Model Drift & Monitoring",
             "Deploying ML pipelines as high-performance REST microservices with Pydantic validation, latency telemetry, and drift detection.",
             "An ML model creates zero business value until served reliably to end-users with monitoring for data drift.",
             "FastAPI parses and validates incoming JSON payloads, passes feature vectors to the loaded pipeline, and returns predictions with latency tracking.",
             ["1. Load serialized `.joblib` model at server startup.", "2. Define Pydantic schema for strict input type checking.", "3. Execute inference inside `/predict` async route.", "4. Monitor prediction distributions for concept drift."],
             "Client POST /predict {'tenure': 24, 'salary': 85000} -> FastAPI validates schema -> Model predicts {churn_risk: 0.12, latency_ms: 3.2}.",
             "Standard production microservice architecture for real-time inference.",
             "from pydantic import BaseModel\nimport numpy as np\n\nclass PredictionRequest(BaseModel):\n    feature_1: float\n    feature_2: float\n\ndef mock_predict_service(payload: PredictionRequest):\n    features = np.array([[payload.feature_1, payload.feature_2]])\n    # Simulated prediction\n    score = float(np.sum(features) * 0.5)\n    return {'score': score, 'status': 'SUCCESS'}\n\nreq = PredictionRequest(feature_1=1.5, feature_2=2.5)\nprint('Prediction Response:', mock_predict_service(req))",
             "1. Pydantic guarantees type safety and rejects invalid inputs with HTTP 422.\n2. In-memory model execution delivers sub-10ms response latency.",
             "Prediction Response: {'score': 2.0, 'status': 'SUCCESS'}",
             "Ignoring distribution shift (data drift) over time, resulting in silent model accuracy degradation in production.",
             "Implement a population stability index (PSI) drift monitoring function in Python.",
             "FastAPI combined with Pydantic and drift monitoring provides a resilient foundation for production ML serving.")
        ]
    ]

    for idx, concepts_list in enumerate(ml_lessons):
        mod = data["modules"][idx]
        mod["content"]["keyConcepts"] = []
        for c in concepts_list:
            mod["content"]["keyConcepts"].append({
                "topic": c[0],
                "title": c[1],
                "description": c[2],
                "whyItMatters": c[3],
                "howItWorks": c[4],
                "stepByStep": c[5],
                "workedExample": c[6],
                "realWorldUsage": c[7],
                "codeSnippet": c[8],
                "codeExplanation": c[9],
                "expectedOutput": c[10],
                "commonMistakes": c[11],
                "practiceTask": c[12],
                "keyTakeaway": c[13]
            })

    save_curriculum_file("course-ml-402.ts", var_name, data)

process_ml()
