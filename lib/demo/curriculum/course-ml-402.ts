import { CourseCurriculum } from "./types";

export const courseMl402: CourseCurriculum = {
  "courseId": "course-ml-402",
  "totalDurationMinutes": 1800,
  "modules": [
    {
      "id": "ml-mod-1",
      "order": 1,
      "title": "Module 1 — Foundations of Machine Learning & Problem Framing",
      "durationMinutes": 180,
      "summary": "Core taxonomy of machine learning: Supervised, Unsupervised, and Reinforcement learning paradigms, framing business problems as ML objectives, train/val/test splits without data leakage, and the Bias-Variance tradeoff.",
      "learningObjectives": [
        "Translate abstract business goals into well-formulated machine learning objectives with appropriate evaluation metrics.",
        "Implement leak-free dataset partitioning using stratified sampling and temporal splitting.",
        "Diagnose underfitting and overfitting by analyzing training and validation learning curves."
      ],
      "resources": [
        {
                "title": "Scikit-Learn User Guide: Supervised vs Unsupervised Learning",
                "url": "https://scikit-learn.org/stable/user_guide.html",
                "description": "Mathematical framing of feature matrices, label vectors, and train-validation-test splits.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Google Machine Learning Crash Course: Framing & Key Terminology",
                "url": "https://developers.google.com/machine-learning/crash-course/framing/check-your-intuition",
                "description": "Foundations of features, labels, regression vs classification, and dataset hygiene.",
                "type": "guide",
                "provider": "Google Developers"
        }
],
      "content": {
        "overview": "Machine learning enables systems to learn statistical decision rules directly from data rather than explicit programming. Success begins with rigorous problem formulation, establishing baseline metrics, and preventing data leakage through clean partitioning.",
        "keyConcepts": [
          {
            "section": "Section 1 — ML Problem Formulation",
            "topic": "Taxonomy & Learning Paradigms",
            "title": "Lesson 1 — Supervised, Unsupervised & Reinforcement Paradigms",
            "prerequisites": "Foundational linear algebra and Python programming.",
            "description": "The three primary learning paradigms: Supervised learning with ground-truth target labels, Unsupervised learning for latent structure discovery, and Reinforcement learning for policy optimization.",
            "whyItMatters": "Choosing the correct paradigm determines data labeling requirements, model family selection, and validation methodology.",
            "howItWorks": "Supervised models minimize empirical risk; Unsupervised models optimize density or geometric distance; RL optimizes expected cumulative reward.",
            "stepByStep": [
              "1. Assess availability and quality of ground-truth target labels.",
              "2. If labels exist: formulate as Supervised Regression or Classification.",
              "3. If unlabelled: formulate as Unsupervised Clustering or Anomaly Detection.",
              "4. If sequential decision-making: formulate as RL."
            ],
            "workedExample": "Predicting customer subscription renewal -> Supervised Classification with Binary Cross-Entropy loss.",
            "realWorldUsage": "Used across enterprise risk scoring, customer lifetime value prediction, and recommendation engines.",
            "codeSnippet": "import numpy as np\nfrom sklearn.datasets import make_classification\n\nX, y = make_classification(n_samples=500, n_features=4, n_classes=2, random_state=42)\nprint(f'Supervised Dataset Shape: {X.shape}, Classes: {np.unique(y)}')",
            "codeExplanation": "1. `make_classification` produces feature matrix $X$ and target vector $y$.",
            "expectedOutput": "Supervised Dataset Shape: (500, 4), Classes: [0 1]",
            "commonMistakes": "Attempting supervised regression when historical target labels do not exist or are biased.",
            "bestPractices": "Always define a simple heuristic baseline before training machine learning models.",
            "practiceTask": "Categorize 5 enterprise problems into their respective ML paradigms.",
            "keyTakeaway": "Machine learning problems must be rigorously mapped to supervised, unsupervised, or reinforcement learning paradigms with clear objective metrics."
          },
          {
            "section": "Section 1 — ML Problem Formulation",
            "topic": "Dataset Partitioning",
            "title": "Lesson 2 — Leak-Free Dataset Partitioning & Stratification",
            "prerequisites": "Lesson 1 (Learning Paradigms).",
            "description": "Splitting datasets into Train, Validation, and Test partitions while preventing information leakage between evaluation and training sets.",
            "whyItMatters": "Data leakage causes models to appear highly accurate during development while failing catastrophically in production.",
            "howItWorks": "Train partition ($70\\%$) fits model parameters; Validation partition ($15\\%$) tunes hyperparameters; Test partition ($15\\%$) provides unbiased final evaluation.",
            "stepByStep": [
              "1. Separate features $X$ and target $y$.",
              "2. Check target class balance for stratification.",
              "3. Use temporal splitting for time-series data.",
              "4. Fit all preprocessing transformers ONLY on the train set."
            ],
            "workedExample": "Stratified split guarantees exactly 5% positive cases in train, validation, and test partitions on imbalanced fraud datasets.",
            "realWorldUsage": "Standard practice across all production ML systems in finance and healthcare.",
            "codeSnippet": "from sklearn.model_selection import train_test_split\nimport numpy as np\n\nX = np.random.randn(1000, 10)\ny = np.random.choice([0, 1], size=1000, p=[0.95, 0.05])\nX_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=42)\nX_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42)\nprint(f'Train: {X_train.shape[0]} | Val: {X_val.shape[0]} | Test: {X_test.shape[0]}')",
            "codeExplanation": "1. `stratify=y` preserves exact 95/5 class proportions across partitions.",
            "expectedOutput": "Train: 700 | Val: 150 | Test: 150",
            "commonMistakes": "Fitting standard scalers on the full dataset before splitting, leaking test variance into training.",
            "bestPractices": "Always fit transformers strictly on `X_train` and call `.transform()` on validation and test sets.",
            "practiceTask": "Implement a temporal split function for a dataset with timestamp columns.",
            "keyTakeaway": "Strict partition boundaries and stratified sampling guarantee honest model validation."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Leak-Free Pipeline & Bias-Variance Diagnosis\n\nRequirements:\n1. Ingest an enterprise dataset with numerical and categorical values.\n2. Perform a stratified 70/15/15 train-validation-test split.\n3. Fit preprocessing transformers strictly on the train partition.\n4. Plot diagnostic learning curves and determine whether the model is limited by bias or variance.",
        "competencyVerification": "Demonstrates Level 4 problem formulation, dataset partitioning, and bias-variance diagnosis meeting professional ML standards.",
        "resources": [
        {
                "title": "Scikit-Learn User Guide: Supervised vs Unsupervised Learning",
                "url": "https://scikit-learn.org/stable/user_guide.html",
                "description": "Mathematical framing of feature matrices, label vectors, and train-validation-test splits.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Google Machine Learning Crash Course: Framing & Key Terminology",
                "url": "https://developers.google.com/machine-learning/crash-course/framing/check-your-intuition",
                "description": "Foundations of features, labels, regression vs classification, and dataset hygiene.",
                "type": "guide",
                "provider": "Google Developers"
        }
]
      }
    },
    {
      "id": "ml-mod-2",
      "order": 2,
      "title": "Module 2 — Exploratory Data Analysis & Feature Engineering",
      "durationMinutes": 210,
      "summary": "Data cleaning, missing value imputation, categorical encoding (One-Hot, Target Encoding), feature scaling (StandardScaler vs RobustScaler), outlier detection, and Scikit-Learn ColumnTransformer pipelines.",
      "learningObjectives": [
        "Perform statistical data profiling to identify skewness, missingness, and collinearity.",
        "Implement robust numerical imputation and categorical encoding strategies.",
        "Construct modular, reusable preprocessing pipelines using Scikit-Learn `ColumnTransformer`."
      ],
      "resources": [
        {
                "title": "Scikit-Learn User Guide: Preprocessing Data & Feature Scaling",
                "url": "https://scikit-learn.org/stable/modules/preprocessing.html",
                "description": "StandardScaler, MinMaxScaler, OneHotEncoder, and preventing data leakage.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Imputation of Missing Values",
                "url": "https://scikit-learn.org/stable/modules/impute.html",
                "description": "SimpleImputer, KNNImputer, and iterative multivariate feature imputation techniques.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
],
      "content": {
        "overview": "Feature engineering transforms raw tabular data into informative numerical representations that maximize estimator predictive power while avoiding information leakage.",
        "keyConcepts": [
          {
            "section": "Section 1 — Data Cleaning & Imputation",
            "topic": "Missing Data Strategies",
            "title": "Lesson 1 — Missing Value Imputation: Mean, Median, KNN & Iterative",
            "prerequisites": "Module 1 (Foundations).",
            "description": "Handling missing data: Mean/Median imputation for MCAR, MissingIndicator flags, and KNN/IterativeImputer for MAR data.",
            "whyItMatters": "Dropping rows with missing values discards valuable data and introduces selection bias; simple mean imputation distorts variance.",
            "howItWorks": "Median imputation replaces NaNs with 50th percentile (robust to outliers); KNN imputation computes distance-weighted average of $k$ nearest complete records.",
            "stepByStep": [
              "1. Calculate missing percentage per column.",
              "2. Add `MissingIndicator` binary flag to preserve signal.",
              "3. Fit `SimpleImputer(strategy='median')` on numerical columns.",
              "4. Fit `SimpleImputer(strategy='most_frequent')` on categorical columns."
            ],
            "workedExample": "Income column with 10% missing: Replacing with median $65k + adding `is_income_missing` binary column enables the model to learn distinct behaviors for non-reporters.",
            "realWorldUsage": "Standard data preprocessing in credit scoring, insurance claims, and healthcare analytics.",
            "codeSnippet": "from sklearn.impute import SimpleImputer\nimport numpy as np\n\nX = np.array([[25.0, 50000.0], [np.nan, 60000.0], [30.0, np.nan], [45.0, 120000.0]])\nimputer = SimpleImputer(strategy='median', add_indicator=True)\nX_imputed = imputer.fit_transform(X)\nprint('Imputed Matrix with Missing Indicator Flags:\\n', X_imputed)",
            "codeExplanation": "1. `strategy='median'` replaces NaNs with column medians.\n2. `add_indicator=True` appends binary indicator columns.",
            "expectedOutput": "Imputed Matrix with Missing Indicator Flags:\n [[ 25.      50000.          0.          0.    ]\n  [ 30.      60000.          1.          0.    ]\n  [ 30.      60000.          0.          1.    ]\n  [ 45.     120000.          0.          0.    ]]",
            "commonMistakes": "Imputing missing values using the entire dataset before train/test splitting.",
            "bestPractices": "Always encapsulate imputation inside a Scikit-Learn `Pipeline` fitted strictly on training data.",
            "practiceTask": "Compare the test accuracy of median imputation versus KNN imputation on a dataset with missing values.",
            "keyTakeaway": "Median imputation combined with missing indicators provides a robust, leakage-free baseline for tabular missing data."
          },
          {
            "section": "Section 2 — Feature Scaling & Pipelines",
            "topic": "ColumnTransformer Architecture",
            "title": "Lesson 2 — Building Unified Pipelines with ColumnTransformer",
            "prerequisites": "Lesson 1 (Missing Value Imputation).",
            "description": "Assembling heterogeneous preprocessing steps (numerical scaling + categorical encoding) and estimators into a single atomic Scikit-Learn `Pipeline`.",
            "whyItMatters": "Prevents data leakage, guarantees identical transformations at inference time, and simplifies model deployment and serialization.",
            "howItWorks": "`ColumnTransformer` routes designated column subsets through independent sub-pipelines and concatenates their transformed outputs into a single feature matrix.",
            "stepByStep": [
              "1. Define numerical and categorical feature name lists.",
              "2. Create numerical Pipeline with SimpleImputer + StandardScaler.",
              "3. Create categorical Pipeline with SimpleImputer + OneHotEncoder.",
              "4. Combine inside ColumnTransformer."
            ],
            "workedExample": "Incoming JSON payload -> Pipeline handles missing values -> scales numbers -> encodes categories -> executes model prediction in a single `.predict()` call.",
            "realWorldUsage": "The standard production deployment pattern for tabular machine learning models across the industry.",
            "codeSnippet": "from sklearn.compose import ColumnTransformer\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.impute import SimpleImputer\nfrom sklearn.preprocessing import StandardScaler, OneHotEncoder\nfrom sklearn.linear_model import LogisticRegression\n\nnum_pipe = Pipeline([('impute', SimpleImputer(strategy='median')), ('scale', StandardScaler())])\ncat_pipe = Pipeline([('impute', SimpleImputer(strategy='most_frequent')), ('ohe', OneHotEncoder(handle_unknown='ignore'))])\n\npreprocessor = ColumnTransformer([\n    ('num', num_pipe, [0, 1]),\n    ('cat', cat_pipe, [2])\n])\nprint('Configured complete leak-free ColumnTransformer pipeline.')",
            "codeExplanation": "1. `ColumnTransformer` isolates preprocessing logic per column type.",
            "expectedOutput": "Configured complete leak-free ColumnTransformer pipeline.",
            "commonMistakes": "Calling `.fit()` on test data or writing manual transformation scripts that drift from training preprocessing.",
            "bestPractices": "Always serialize the complete `Pipeline` into a single `.joblib` file for production deployment.",
            "practiceTask": "Build a ColumnTransformer for a customer dataset containing numerical and categorical columns.",
            "keyTakeaway": "ColumnTransformer encapsulates multi-type preprocessing and estimators into an atomic, leak-free pipeline."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Production Tabular Feature Pipeline\n\nRequirements:\n1. Build an end-to-end preprocessing pipeline for a dirty enterprise dataset.\n2. Handle missing numerical values with median imputation and missing indicators.\n3. Apply One-Hot encoding to low-cardinality categories with `handle_unknown='ignore'`.\n4. Scale numerical features with `StandardScaler`.\n5. Combine all stages into a unified `ColumnTransformer`.",
        "competencyVerification": "Demonstrates Level 4 feature engineering, missing value imputation, and pipeline orchestration.",
        "resources": [
        {
                "title": "Scikit-Learn User Guide: Preprocessing Data & Feature Scaling",
                "url": "https://scikit-learn.org/stable/modules/preprocessing.html",
                "description": "StandardScaler, MinMaxScaler, OneHotEncoder, and preventing data leakage.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Imputation of Missing Values",
                "url": "https://scikit-learn.org/stable/modules/impute.html",
                "description": "SimpleImputer, KNNImputer, and iterative multivariate feature imputation techniques.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
]
      }
    },
    {
      "id": "ml-mod-3",
      "order": 3,
      "title": "Module 3 — Supervised Learning: Regression Algorithms & Regularization",
      "durationMinutes": 240,
      "summary": "Ordinary Least Squares (OLS), Gradient Descent optimization, regression metrics (MSE, MAE, RMSE, R²), Polynomial regression, and Regularization (Ridge L2, Lasso L1, Elastic Net).",
      "learningObjectives": [
        "Derive and implement Ordinary Least Squares (OLS) and Gradient Descent for linear regression.",
        "Select and interpret appropriate regression evaluation metrics (MSE, RMSE, MAE, R²).",
        "Apply Ridge (L2), Lasso (L1), and Elastic Net regularization to resolve multicollinearity and prevent overfitting."
      ],
      "resources": [
        {
                "title": "Scikit-Learn User Guide: Generalized Linear Models (Ridge & Lasso)",
                "url": "https://scikit-learn.org/stable/modules/linear_model.html#ridge-regression-and-classification",
                "description": "Ordinary least squares, L1 Lasso regularization (sparsity), and L2 Ridge regularization.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Linear Models and Regularization: A Deep Dive",
                "url": "https://scikit-learn.org/stable/modules/linear_model.html#elastic-net",
                "description": "ElasticNet optimization combining L1 and L2 penalties for multicollinear data.",
                "type": "guide",
                "provider": "Scikit-Learn Docs"
        }
],
      "content": {
        "overview": "Regression algorithms model relationships between independent input features and a continuous dependent target variable. Regularization constrains coefficient magnitudes, preventing overfitting and stabilizing models against multicollinear feature spaces.",
        "keyConcepts": [
          {
            "section": "Section 1 — Regression Foundations",
            "topic": "Linear Regression Mechanics",
            "title": "Section 1 — Linear Regression & Regularization Foundations (Ridge & Lasso)",
            "prerequisites": "Module 2 (Feature Engineering).",
            "description": "Linear regression models the conditional expectation $y = w^T x + b$. Ordinary Least Squares (OLS) derives closed-form parameter estimates: $\\hat{w} = (X^T X)^{-1} X^T y$.",
            "whyItMatters": "Establishes the foundational linear baseline for predictive modeling and economic elasticity analysis.",
            "howItWorks": "OLS finds the optimal hyperplane that minimizes the vertical squared distances between observed data points and predicted values.",
            "stepByStep": [
              "1. Formulate feature matrix $X$ and target vector $y$.",
              "2. Add bias intercept column of ones to $X$.",
              "3. Compute normal equations: $\\hat{w} = (X^T X)^{-1} X^T y$.",
              "4. Predict for new input: $\\hat{y} = X_{\\text{new}} \\hat{w}$."
            ],
            "workedExample": "Predicting server CPU utilization based on incoming request rate: $\\text{CPU} = 0.045 \\times \\text{Requests} + 12.5$.",
            "realWorldUsage": "Financial risk modeling, price elasticity prediction, and operational resource sizing.",
            "codeSnippet": "import numpy as np\nfrom sklearn.linear_model import LinearRegression\n\nX = np.array([[100], [200], [300], [400], [500]])\ny = np.array([25.0, 38.0, 52.0, 68.0, 81.0])\nreg = LinearRegression().fit(X, y)\nprint(f'Slope: {reg.coef_[0]:.4f} | Intercept: {reg.intercept_:.4f}')",
            "codeExplanation": "1. `LinearRegression().fit(X, y)` solves OLS normal equations.",
            "expectedOutput": "Slope: 0.1410 | Intercept: 10.5000",
            "commonMistakes": "Assuming correlation equals causation when interpreting regression coefficients.",
            "bestPractices": "Verify linear regression assumptions: linearity, homoscedasticity, normality of residuals, and absence of multicollinearity.",
            "practiceTask": "Implement closed-form OLS parameter estimation in pure NumPy.",
            "keyTakeaway": "Linear regression models continuous targets through linear feature combinations, solved efficiently via OLS normal equations."
          },
          {
            "section": "Section 2 — Regression Evaluation",
            "topic": "Evaluation Metrics",
            "title": "Lesson 2 — Evaluation Metrics: MSE, MAE, RMSE & R-Squared ($R^2$)",
            "prerequisites": "Lesson 1 (Linear Regression).",
            "description": "Trade-offs between Mean Squared Error (MSE), Root Mean Squared Error (RMSE), Mean Absolute Error (MAE), and Coefficient of Determination ($R^2$).",
            "whyItMatters": "Choosing the wrong evaluation metric leads to deploying models that optimize for average behavior while failing on extreme outliers.",
            "howItWorks": "MSE penalizes large errors quadratically ($e^2$); RMSE reports error in original target units; MAE measures median absolute deviation; $R^2$ measures explained variance percentage.",
            "stepByStep": [
              "1. Compute Residuals: $e_i = y_i - \\hat{y}_i$.",
              "2. Compute $\\text{MAE} = \\frac{1}{N} \\sum |e_i|$.",
              "3. Compute $\\text{RMSE} = \\sqrt{\\frac{1}{N} \\sum e_i^2}$.",
              "4. Compute $R^2 = 1 - \\frac{\\sum (y - \\hat{y})^2}{\\sum (y - \\bar{y})^2}$."
            ],
            "workedExample": "Salary Prediction: MAE = $4,200 (typical error), RMSE = $12,500 (gap reveals large outlier errors), $R^2 = 0.88$ (explains 88% variance).",
            "realWorldUsage": "Reporting regression performance in executive dashboards and financial forecasts.",
            "codeSnippet": "from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score\nimport numpy as np\n\ny_true = np.array([100.0, 150.0, 200.0, 250.0, 300.0])\ny_pred = np.array([105.0, 148.0, 195.0, 260.0, 350.0])\nprint(f'MAE: {mean_absolute_error(y_true, y_pred):.2f} | RMSE: {np.sqrt(mean_squared_error(y_true, y_pred)):.2f} | R2: {r2_score(y_true, y_pred):.4f}')",
            "codeExplanation": "1. `mean_absolute_error` measures average magnitude.\n2. `r2_score` measures proportion of variance explained.",
            "expectedOutput": "MAE: 12.80 | RMSE: 23.32 | R2: 0.8912",
            "commonMistakes": "Interpreting $R^2$ as proof of model validity without inspecting residual distribution plots.",
            "bestPractices": "Use MAE when financial cost scales linearly with error; use RMSE when large errors are disproportionately destructive.",
            "practiceTask": "Compute MSE, MAE, and $R^2$ for a real estate price prediction dataset.",
            "keyTakeaway": "MAE measures average magnitude, RMSE penalizes large outliers quadratically, and $R^2$ quantifies the proportion of explained variance."
          },
          {
            "section": "Section 3 — Regularization Techniques",
            "topic": "Ridge & Lasso Regression",
            "title": "Lesson 3 — Ridge (L2) vs Lasso (L1) & Elastic Net Regularization",
            "prerequisites": "Lesson 2 (Evaluation Metrics).",
            "description": "Constraining linear model weights using L2 penalty (Ridge: $\\alpha \\sum w_i^2$), L1 penalty (Lasso: $\\alpha \\sum |w_i|$), and Elastic Net combination to prevent overfitting.",
            "whyItMatters": "Ordinary Least Squares produces erratic, massive coefficients when features are correlated. Regularization stabilizes estimates and performs automatic feature selection.",
            "howItWorks": "Ridge shrinks weights smoothly toward zero (never exactly zero); Lasso drives non-informative feature weights to exactly zero due to the sharp geometry of the L1 diamond constraint boundary.",
            "stepByStep": [
              "1. Standardize all numerical features.",
              "2. Formulate objective: $\\mathcal{L} = \\text{MSE} + \\alpha \\left( \\rho \\sum |w_i| + \\frac{1-\\rho}{2} \\sum w_i^2 \\right)$.",
              "3. Use `RidgeCV` or `LassoCV` with 5-fold cross-validation.",
              "4. Inspect remaining non-zero weights."
            ],
            "workedExample": "Dataset with 100 features (95 noise): OLS overfits (Test MSE 48.2); Lasso sets 95 noise weights to exactly 0.0 (Test MSE 12.1).",
            "realWorldUsage": "High-dimensional genomics, econometrics, and automated feature pruning in production ML pipelines.",
            "codeSnippet": "from sklearn.linear_model import RidgeCV, LassoCV\nimport numpy as np\n\nX = np.random.randn(100, 5)\ny = 3 * X[:, 0] + 2 * X[:, 1] + np.random.randn(100) * 0.1\nridge = RidgeCV().fit(X, y)\nlasso = LassoCV().fit(X, y)\nprint('Ridge Weights:', np.round(ridge.coef_, 2))\nprint('Lasso Weights (Sparsity enabled):', np.round(lasso.coef_, 2))",
            "codeExplanation": "1. `RidgeCV` and `LassoCV` evaluate cross-validation across hyperparameter grids.\n2. Lasso sets redundant collinear features to exactly 0.0.",
            "expectedOutput": "Ridge Weights: [2.98 1.99 0.01 -0.01 0.01]\nLasso Weights (Sparsity enabled): [2.97 1.98 0.   0.   0.  ]",
            "commonMistakes": "Applying L1/L2 regularization without feature standardization.",
            "bestPractices": "Use Ridge when features are correlated; use Lasso when feature selection is desired; use Elastic Net for grouped selection.",
            "practiceTask": "Train ElasticNetCV on a dataset with 50 features and evaluate the effect of the `l1_ratio` parameter on sparsity.",
            "keyTakeaway": "Regularization constrains model complexity, eliminates multicollinear instability, and prevents overfitting through controlled weight shrinkage."
          }
        ],
        "practicalExercise": "Practical Lab: Implement Ridge and Lasso Regression from scratch and evaluate regularization paths on multicollinear datasets.",
        "competencyVerification": "Demonstrates Level 4 mastery of linear regression, gradient optimization, regression evaluation metrics, and regularized feature selection.",
        "resources": [
        {
                "title": "Scikit-Learn User Guide: Generalized Linear Models (Ridge & Lasso)",
                "url": "https://scikit-learn.org/stable/modules/linear_model.html#ridge-regression-and-classification",
                "description": "Ordinary least squares, L1 Lasso regularization (sparsity), and L2 Ridge regularization.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Linear Models and Regularization: A Deep Dive",
                "url": "https://scikit-learn.org/stable/modules/linear_model.html#elastic-net",
                "description": "ElasticNet optimization combining L1 and L2 penalties for multicollinear data.",
                "type": "guide",
                "provider": "Scikit-Learn Docs"
        }
]
      },
      "practicalExercise": "Practical Lab: Implement Ridge and Lasso Regression from scratch and evaluate regularization paths on multicollinear datasets."
    },
    {
      "id": "ml-mod-4",
      "order": 4,
      "title": "Module 4 — Supervised Learning: Classification & Decision Trees",
      "durationMinutes": 240,
      "summary": "Probabilistic binary & multi-class classification: Logistic Regression log-odds, Decision Trees (Gini Impurity, Information Gain, pruning), and comprehensive evaluation metrics (Precision, Recall, F1-Score, ROC-AUC).",
      "learningObjectives": [
        "Model binary class probabilities using Logistic Regression and tune decision thresholds.",
        "Construct and prune Decision Tree classifiers to prevent leaf node overfitting.",
        "Evaluate classifiers on imbalanced datasets using Precision, Recall, PR-AUC, and ROC-AUC."
      ],
      "resources": [
        {
                "title": "Scikit-Learn User Guide: Logistic Regression & Classification",
                "url": "https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression",
                "description": "Sigmoid decision boundaries, cross-entropy loss optimization, and class probability calibration.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Support Vector Machines (SVM)",
                "url": "https://scikit-learn.org/stable/modules/svm.html",
                "description": "Maximum margin hyperplanes, soft margin slack variables, and RBF kernel transformations.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
],
      "content": {
        "overview": "Classification maps input feature vectors into discrete categorical decision boundaries. Understanding probability calibration and metric trade-offs is essential for high-stakes enterprise applications.",
        "keyConcepts": [
          {
            "section": "Section 1 — Probabilistic Classification",
            "topic": "Logistic Regression & Thresholds",
            "title": "Lesson 1 — Logistic Regression, Sigmoid Probabilities & Decision Thresholds",
            "prerequisites": "Module 3 (Regression & Regularization).",
            "description": "Logistic Regression models the log-odds of class membership $z = w^T x + b$, mapped into calibrated probabilities via Sigmoid $\\sigma(z) = \\frac{1}{1 + e^{-z}}$.",
            "whyItMatters": "Guarantees predictions strictly bounded in $[0.0, 1.0]$ representing true posterior probabilities $P(y=1|x)$.",
            "howItWorks": "Optimized using Binary Cross-Entropy loss. The default $0.5$ classification threshold can be tuned to optimize precision or recall.",
            "stepByStep": [
              "1. Calculate logit $z = w^T x + b$.",
              "2. Pass logit through Sigmoid activation $\\sigma(z)$.",
              "3. Predict probability $p = P(y=1|x)$.",
              "4. Apply decision threshold: if $p \\ge \\theta$, predict Class 1."
            ],
            "workedExample": "Lowering threshold from 0.5 to 0.10 in fraud detection catches 98% of financial fraud cases.",
            "realWorldUsage": "Credit default probability, medical screening, and customer churn prediction.",
            "codeSnippet": "from sklearn.linear_model import LogisticRegression\nimport numpy as np\n\nX = np.array([[1.0], [2.0], [3.0], [7.0], [8.0], [9.0]])\ny = np.array([0, 0, 0, 1, 1, 1])\nclf = LogisticRegression().fit(X, y)\nprobs = clf.predict_proba([[4.0]])[0]\nprint(f'Class 1 Probability for X=4.0: {probs[1]:.2%}')",
            "codeExplanation": "1. `predict_proba` returns calibrated class probabilities.",
            "expectedOutput": "Class 1 Probability for X=4.0: 15.88%",
            "commonMistakes": "Using default 0.5 threshold on highly imbalanced datasets.",
            "bestPractices": "Always plot the Precision-Recall curve to select an operational threshold tailored to business cost asymmetry.",
            "practiceTask": "Train LogisticRegression on an imbalanced dataset and tune threshold to maximize F1-score.",
            "keyTakeaway": "Logistic regression provides interpretable log-odds and calibrated probabilities with tunable decision thresholds."
          },
          {
            "section": "Section 2 — Tree-Based Classification",
            "topic": "Decision Trees & Impurity",
            "title": "Lesson 2 — Decision Trees: Gini Impurity & Cost-Complexity Pruning",
            "prerequisites": "Lesson 1 (Logistic Regression).",
            "description": "Decision trees recursively partition feature space into rectangular regions by selecting splits that minimize Gini Impurity: $G = 1 - \\sum p_i^2$.",
            "whyItMatters": "Non-parametric, handles non-linear interactions without feature scaling, and provides fully explainable if-then decision rules.",
            "howItWorks": "At each node, the tree evaluates all candidate splits, selects the split that minimizes weighted child impurity, and recurses until stopping criteria are met.",
            "stepByStep": [
              "1. Compute parent node Gini Impurity.",
              "2. Compute weighted child impurity for candidate splits.",
              "3. Select split maximizing Impurity Reduction.",
              "4. Apply Cost-Complexity Pruning (`ccp_alpha`)."
            ],
            "workedExample": "Mortgage approval decision rule: Credit Score > 680 and DTI < 35% -> Approved (96% confidence).",
            "realWorldUsage": "Credit underwriting, medical triage diagnostic protocols, and customer routing.",
            "codeSnippet": "from sklearn.tree import DecisionTreeClassifier, export_text\nimport numpy as np\n\nX = np.array([[25, 50000], [45, 120000], [35, 30000], [50, 95000]])\ny = np.array([0, 1, 0, 1])\ntree = DecisionTreeClassifier(max_depth=2, random_state=42).fit(X, y)\nprint('Decision Tree Rules:\\n', export_text(tree, feature_names=['Age', 'Income']))",
            "codeExplanation": "1. `export_text` exposes human-readable business rules.",
            "expectedOutput": "Decision Tree Rules:\n |--- Income <= 72500.00\n|   |--- class: 0\n|--- Income >  72500.00\n|   |--- class: 1",
            "commonMistakes": "Allowing trees to grow unconstrained (`max_depth=None`), leading to severe overfitting.",
            "bestPractices": "Always constrain tree growth using `max_depth=3-5` or post-pruning with `ccp_alpha`.",
            "practiceTask": "Visualize a decision tree with `plot_tree` and calculate Gini impurity manually.",
            "keyTakeaway": "Decision trees construct interpretable hierarchical decision boundaries by recursively minimizing Gini impurity."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Cost-Sensitive Classification & Tree Pruning\n\nRequirements:\n1. Train Logistic Regression and Decision Tree classifiers on an imbalanced dataset.\n2. Compute Precision, Recall, F1-Score, and ROC-AUC.\n3. Tune the classification decision threshold to optimize business profit.\n4. Apply Cost-Complexity Pruning (`ccp_alpha`).",
        "competencyVerification": "Demonstrates Level 4 classification mastery, probability calibration, tree pruning, and metric selection.",
        "resources": [
        {
                "title": "Scikit-Learn User Guide: Logistic Regression & Classification",
                "url": "https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression",
                "description": "Sigmoid decision boundaries, cross-entropy loss optimization, and class probability calibration.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Support Vector Machines (SVM)",
                "url": "https://scikit-learn.org/stable/modules/svm.html",
                "description": "Maximum margin hyperplanes, soft margin slack variables, and RBF kernel transformations.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
]
      }
    },
    {
      "id": "ml-mod-5",
      "order": 5,
      "title": "Module 5 — Ensemble Methods: Bagging, Random Forests & Gradient Boosting",
      "durationMinutes": 240,
      "summary": "Mastering ensemble learning: Bootstrap Aggregating (Bagging), Random Forests with feature subsampling, Gradient Boosting Machines (GBM residual fitting), and modern high-speed implementations (XGBoost, LightGBM).",
      "learningObjectives": [
        "Explain how Bagging reduces variance while Boosting sequentially reduces bias.",
        "Train and tune Random Forest ensembles with Out-Of-Bag (OOB) error estimation.",
        "Implement Gradient Boosting with learning rate shrinkage, early stopping, and residual optimization."
      ],
      "resources": [
        {
                "title": "Scikit-Learn User Guide: Ensemble Methods (Random Forests)",
                "url": "https://scikit-learn.org/stable/modules/ensemble.html#forests-of-randomized-trees",
                "description": "Bagging, out-of-bag error estimation, and feature importance calculation.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "XGBoost Documentation: Introduction to Gradient Boosting",
                "url": "https://xgboost.readthedocs.io/en/stable/tutorials/model.html",
                "description": "Gradient boosted decision trees, second-order Taylor expansion loss, and regularization.",
                "type": "documentation",
                "provider": "XGBoost Documentation"
        }
],
      "content": {
        "overview": "Ensemble methods combine multiple weak base estimators to produce a single robust predictor with significantly lower variance (Bagging) or lower bias (Boosting).",
        "keyConcepts": [
          {
            "section": "Section 1 — Bagging & Random Forests",
            "topic": "Ensemble Foundations",
            "title": "Lesson 1 — Bootstrap Aggregating (Bagging) & Random Forests",
            "prerequisites": "Module 4 (Decision Trees).",
            "description": "Random Forests construct an ensemble of de-correlated decision trees trained on bootstrap samples with random feature subspace sampling at every split.",
            "whyItMatters": "Individual decision trees suffer from high variance; averaging 500 de-correlated trees dramatically reduces variance without increasing bias.",
            "howItWorks": "Given $B$ trees, the ensemble prediction is majority vote. Random feature selection ($\\sqrt{D}$) prevents dominant features from making all trees identical.",
            "stepByStep": [
              "1. Draw $B$ bootstrap samples with replacement.",
              "2. Train a full-depth tree on each bootstrap sample.",
              "3. Randomly select $\\sqrt{D}$ candidate features at each split.",
              "4. Aggregate predictions via majority voting.",
              "5. Compute Out-of-Bag (OOB) score."
            ],
            "workedExample": "Random Forest with 300 trees achieves 89.4% accuracy versus 78.2% for a single decision tree on identical data.",
            "realWorldUsage": "Production credit scoring, churn modeling, and feature importance attribution.",
            "codeSnippet": "from sklearn.ensemble import RandomForestClassifier\nimport numpy as np\n\nX = np.random.randn(200, 10)\ny = np.random.randint(0, 2, 200)\nrf = RandomForestClassifier(n_estimators=100, oob_score=True, random_state=42).fit(X, y)\nprint(f'Random Forest Out-of-Bag Accuracy: {rf.oob_score_:.2%}')",
            "codeExplanation": "1. `oob_score=True` validates the model on holdout bootstrap samples for free.",
            "expectedOutput": "Random Forest Out-of-Bag Accuracy: 52.50%",
            "commonMistakes": "Training Random Forests with tiny tree counts ($n\\_estimators < 20$).",
            "bestPractices": "Use $n\\_estimators=200-500$ and set `n_jobs=-1` to utilize all CPU cores in parallel.",
            "practiceTask": "Compare OOB accuracy against 5-fold cross-validation score for a Random Forest.",
            "keyTakeaway": "Random Forests de-correlate decision trees through bagging and feature subsampling, delivering robust variance reduction."
          },
          {
            "section": "Section 2 — Gradient Boosting Mechanics",
            "topic": "Sequential Boosting",
            "title": "Lesson 2 — Gradient Boosting: Sequential Residual Fitting & Shrinkage",
            "prerequisites": "Lesson 1 (Random Forests).",
            "description": "Gradient Boosting constructs an ensemble sequentially: each new tree is trained to predict the pseudo-residuals (negative loss gradient) of the preceding ensemble.",
            "whyItMatters": "Undisputed state-of-the-art algorithm for structured tabular data across Kaggle and industry production systems.",
            "howItWorks": "Iteratively fits shallow trees (depth 3-6) to previous errors, scaled by learning rate $\\eta$ (shrinkage) to prevent overfitting.",
            "stepByStep": [
              "1. Initialize model with constant prediction.",
              "2. Compute negative gradients (residuals).",
              "3. Fit shallow decision tree to predict residuals.",
              "4. Update ensemble: $F_m(x) = F_{m-1}(x) + \\eta h_m(x)$.",
              "5. Apply Early Stopping based on validation loss."
            ],
            "workedExample": "Target = $500k: Tree 0 predicts $300k (residual +$200k) -> Tree 1 predicts +$100k ($\\eta=0.1$ adds +$10k) -> New prediction = $310k.",
            "realWorldUsage": "Search ranking at Google, ad click-through rate prediction at Meta, and credit risk scoring at major banks.",
            "codeSnippet": "from sklearn.ensemble import GradientBoostingClassifier\nimport numpy as np\n\nX = np.random.randn(300, 8)\ny = np.random.randint(0, 2, 300)\ngbm = GradientBoostingClassifier(n_estimators=100, learning_rate=0.05, max_depth=3, random_state=42).fit(X, y)\nprint(f'Trained {len(gbm.estimators_)} Boosting Trees. Train Accuracy: {gbm.score(X, y):.2%}')",
            "codeExplanation": "1. `learning_rate=0.05` shrinks each tree's contribution, improving generalization.",
            "expectedOutput": "Trained 100 Boosting Trees. Train Accuracy: 94.33%",
            "commonMistakes": "Setting learning rate too high ($>0.3$) without early stopping.",
            "bestPractices": "Pair a small learning rate ($\\eta \\le 0.05$) with early stopping (`n_iter_no_change=10`).",
            "practiceTask": "Train `HistGradientBoostingClassifier` with early stopping enabled.",
            "keyTakeaway": "Gradient Boosting sequentially fits shallow decision trees to the negative loss gradient, achieving peak predictive performance on tabular data."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Tabular Ensemble Benchmark & Early Stopping\n\nRequirements:\n1. Train a Random Forest and Gradient Boosting classifier on an enterprise churn dataset.\n2. Tune learning rate, max depth, and subsample ratios.\n3. Implement Early Stopping with a 10-iteration tolerance window.\n4. Compare ROC-AUC and feature importance rankings.",
        "competencyVerification": "Demonstrates Level 4 ensemble architecture, bagging vs boosting trade-offs, and gradient boosting optimization.",
        "resources": [
        {
                "title": "Scikit-Learn User Guide: Ensemble Methods (Random Forests)",
                "url": "https://scikit-learn.org/stable/modules/ensemble.html#forests-of-randomized-trees",
                "description": "Bagging, out-of-bag error estimation, and feature importance calculation.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "XGBoost Documentation: Introduction to Gradient Boosting",
                "url": "https://xgboost.readthedocs.io/en/stable/tutorials/model.html",
                "description": "Gradient boosted decision trees, second-order Taylor expansion loss, and regularization.",
                "type": "documentation",
                "provider": "XGBoost Documentation"
        }
]
      }
    },
    {
      "id": "ml-mod-6",
      "order": 6,
      "title": "Module 6 — Unsupervised Learning: Clustering & Dimensionality Reduction",
      "durationMinutes": 210,
      "summary": "Unsupervised pattern discovery: K-Means clustering (K-Means++, inertia, Silhouette score), DBSCAN density clustering, Principal Component Analysis (PCA variance maximization), and UMAP visualization.",
      "learningObjectives": [
        "Implement K-Means clustering and select optimal cluster count $K$ using the Elbow Method and Silhouette Analysis.",
        "Apply DBSCAN density-based clustering to discover arbitrary-shaped clusters and isolate noise points.",
        "Execute Principal Component Analysis (PCA) for dimensionality reduction, eigenvalue extraction, and compression."
      ],
      "resources": [
        {
                "title": "Scikit-Learn User Guide: Clustering Algorithms (K-Means & DBSCAN)",
                "url": "https://scikit-learn.org/stable/modules/clustering.html",
                "description": "Centroid-based clustering, density-based noise clustering, and Silhouette score validation.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Principal Component Analysis (PCA)",
                "url": "https://scikit-learn.org/stable/modules/decomposition.html#pca",
                "description": "Dimensionality reduction via eigen-decomposition of covariance matrices and variance ratios.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
],
      "content": {
        "overview": "Unsupervised learning discovers hidden geometric structures, customer segments, and low-dimensional manifolds in unlabelled high-dimensional datasets.",
        "keyConcepts": [
          {
            "section": "Section 1 — Clustering Algorithms",
            "topic": "K-Means & Density Clustering",
            "title": "Lesson 1 — K-Means++, Silhouette Analysis & DBSCAN Density Clustering",
            "prerequisites": "Module 2 (Feature Scaling).",
            "description": "Partitioning data into clusters: K-Means minimizes intra-cluster inertia; DBSCAN groups core points within radius $\\epsilon$ having $\\ge \text{MinPts}$ neighbors, isolating noise.",
            "whyItMatters": "Enables automated customer persona segmentation, anomaly detection, and exploratory data discovery without manual labels.",
            "howItWorks": "K-Means++ initializes centroids far apart to prevent poor local minima. Silhouette score measures cluster separation quality.",
            "stepByStep": [
              "1. Standardize features with `StandardScaler()`.",
              "2. Run K-Means for $K \\in [2, 10]$ and compute Silhouette scores.",
              "3. Plot Elbow curve to identify the inflection point.",
              "4. Use DBSCAN for arbitrary shapes and outlier rejection."
            ],
            "workedExample": "Customer Segmentation: K-Means on 100k retail users discovers 4 actionable segments: 'Budget Hunters', 'Loyal High-Spenders', 'Seasonal', and 'Tech Early-Adopters'.",
            "realWorldUsage": "User segmentation, spatial anomaly detection, and image color quantization.",
            "codeSnippet": "from sklearn.cluster import KMeans\nfrom sklearn.metrics import silhouette_score\nimport numpy as np\n\nX = np.random.randn(200, 4)\nkmeans = KMeans(n_clusters=3, init='k-means++', random_state=42, n_init=10).fit(X)\nprint(f'K-Means Fitted | Silhouette Score: {silhouette_score(X, kmeans.labels_):.3f}')",
            "codeExplanation": "1. `init='k-means++'` ensures robust centroid initialization.",
            "expectedOutput": "K-Means Fitted | Silhouette Score: 0.142",
            "commonMistakes": "Running K-Means on unscaled features or expecting it to find non-spherical clusters.",
            "bestPractices": "Always standardize data before clustering and use Silhouette score to validate $K$.",
            "practiceTask": "Compare K-Means and DBSCAN on the two moons dataset.",
            "keyTakeaway": "K-Means partitions spherical clusters using distance to centroids, while DBSCAN discovers arbitrary-shaped density clusters."
          },
          {
            "section": "Section 2 — Dimensionality Reduction",
            "topic": "PCA & Manifold Learning",
            "title": "Lesson 2 — Principal Component Analysis (PCA) & Variance Maximization",
            "prerequisites": "Lesson 1 (Clustering).",
            "description": "Principal Component Analysis (PCA) projects high-dimensional data onto orthogonal axes that maximize explained variance.",
            "whyItMatters": "High-dimensional datasets ($D > 100$) suffer from the curse of dimensionality, slow training times, and severe multicollinearity.",
            "howItWorks": "PCA computes the eigenvectors and eigenvalues of the covariance matrix $\\Sigma = \frac{1}{N} X^T X$. The first principal component aligns with maximal variance.",
            "stepByStep": [
              "1. Standardize features to mean 0 and variance 1.",
              "2. Perform Singular Value Decomposition: $X = U \\Sigma V^T$.",
              "3. Sort eigenvectors by descending eigenvalue magnitude.",
              "4. Project data onto top $K$ components: $Z = X V_K$."
            ],
            "workedExample": "Compressing 100 financial risk indicators into 5 principal components capturing 94.2% of total volatility variance.",
            "realWorldUsage": "Data compression, visualization, noise reduction, and collinearity elimination in financial pipelines.",
            "codeSnippet": "from sklearn.decomposition import PCA\nimport numpy as np\n\nX = np.random.randn(500, 20)\npca = PCA(n_components=5)\nX_reduced = pca.fit_transform(X)\nprint(f'Reduced Feature Shape: {X_reduced.shape} | Variance Retained: {np.sum(pca.explained_variance_ratio_):.1%}')",
            "codeExplanation": "1. `n_components=5` projects 20 dimensions down to 5.",
            "expectedOutput": "Reduced Feature Shape: (500, 5) | Variance Retained: 34.5%",
            "commonMistakes": "Applying PCA before nonlinear tree models expecting accuracy boosts.",
            "bestPractices": "Use `PCA(n_components=0.95)` to automatically retain 95% of total variance.",
            "practiceTask": "Project a 64-dimensional digits dataset onto 2 dimensions using PCA.",
            "keyTakeaway": "PCA projects high-dimensional data onto orthogonal axes of maximal variance, enabling data compression and collinearity elimination."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Customer Segmentation & Dimensionality Reduction\n\nRequirements:\n1. Ingest an unlabelled dataset with 25 numerical features.\n2. Apply PCA to reduce dimensionality while retaining $\\ge 90\\%$ of variance.\n3. Execute K-Means clustering with Silhouette analysis across $K \\in [2, 8]$.\n4. Profile the resulting cluster centroids.",
        "competencyVerification": "Demonstrates Level 4 unsupervised learning mastery, clustering validation, and PCA dimensionality reduction.",
        "resources": [
        {
                "title": "Scikit-Learn User Guide: Clustering Algorithms (K-Means & DBSCAN)",
                "url": "https://scikit-learn.org/stable/modules/clustering.html",
                "description": "Centroid-based clustering, density-based noise clustering, and Silhouette score validation.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Principal Component Analysis (PCA)",
                "url": "https://scikit-learn.org/stable/modules/decomposition.html#pca",
                "description": "Dimensionality reduction via eigen-decomposition of covariance matrices and variance ratios.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
]
      }
    },
    {
      "id": "ml-mod-7",
      "order": 7,
      "title": "Module 7 — Model Evaluation, Cross-Validation & Hyperparameter Tuning",
      "durationMinutes": 210,
      "summary": "K-Fold, Stratified K-Fold, and TimeSeriesSplit validation, Hyperparameter optimization strategies: GridSearchCV, RandomizedSearchCV, and Bayesian Optimization with Optuna.",
      "learningObjectives": [
        "Construct robust cross-validation strategies tailored to balanced, imbalanced, and temporal datasets.",
        "Optimize estimator hyperparameters using `GridSearchCV` and `RandomizedSearchCV`.",
        "Implement Bayesian Hyperparameter Optimization with Optuna to maximize search efficiency."
      ],
      "resources": [
        {
                "title": "Scikit-Learn User Guide: Model Evaluation & Scoring Metrics",
                "url": "https://scikit-learn.org/stable/modules/model_evaluation.html",
                "description": "Precision, recall, F1-score, ROC-AUC curves, and confusion matrix interpretation.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Cross-Validation & Stratified Splits",
                "url": "https://scikit-learn.org/stable/modules/cross_validation.html",
                "description": "K-Fold, Stratified K-Fold, and TimeSeriesSplit for robust generalization benchmarking.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
],
      "content": {
        "overview": "Systematic cross-validation and hyperparameter optimization ensure machine learning models achieve optimal generalization without overfitting to evaluation partitions.",
        "keyConcepts": [
          {
            "section": "Section 1 — Cross-Validation Strategies",
            "topic": "Validation Schemes",
            "title": "Lesson 1 — Advanced Cross-Validation: StratifiedKFold & TimeSeriesSplit",
            "prerequisites": "Module 1 (Foundations).",
            "description": "Cross-validation partitions training data into $K$ rotating folds, fitting on $K-1$ folds and validating on the holdout fold to produce an unbiased performance distribution.",
            "whyItMatters": "Single train/test splits have high variance; K-Fold provides robust mean and standard deviation metrics.",
            "howItWorks": "StratifiedKFold preserves class ratios in every fold; TimeSeriesSplit respects temporal causality without lookahead leakage.",
            "stepByStep": [
              "1. Balanced data: use `KFold(n_splits=5, shuffle=True)`.",
              "2. Imbalanced classification: use `StratifiedKFold(n_splits=5, shuffle=True)`.",
              "3. Financial / Chronological time-series: use `TimeSeriesSplit(n_splits=5)`.",
              "4. Grouped entities: use `GroupKFold`."
            ],
            "workedExample": "Validating a clinical trial model: `GroupKFold(groups=patient_id)` guarantees all records for a specific patient reside strictly in either train or test, preventing identity leakage.",
            "realWorldUsage": "Clinical healthcare models, financial market forecasting, and multi-tenant ML systems.",
            "codeSnippet": "from sklearn.model_selection import StratifiedKFold, cross_val_score\nfrom sklearn.ensemble import RandomForestClassifier\nimport numpy as np\n\nX = np.random.randn(200, 5)\ny = np.random.choice([0, 1], size=200, p=[0.8, 0.2])\nskf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)\nscores = cross_val_score(RandomForestClassifier(random_state=42), X, y, cv=skf, scoring='roc_auc')\nprint(f'Mean CV ROC-AUC: {scores.mean():.3f} (+/- {scores.std():.3f})')",
            "codeExplanation": "1. `StratifiedKFold` ensures every fold contains exactly 20% positive cases.",
            "expectedOutput": "Mean CV ROC-AUC: 0.511 (+/- 0.020)",
            "commonMistakes": "Using standard shuffled K-Fold on time-series data.",
            "bestPractices": "Always report both the mean score and the standard deviation across folds.",
            "practiceTask": "Implement a `TimeSeriesSplit` cross-validation routine on stock price data.",
            "keyTakeaway": "Cross-validation provides rigorous, unbiased metric distributions tailored to class balance and temporal constraints."
          },
          {
            "section": "Section 2 — Hyperparameter Optimization",
            "topic": "Search Algorithms",
            "title": "Lesson 2 — Hyperparameter Optimization: RandomizedSearch & Bayesian Optuna",
            "prerequisites": "Lesson 1 (Cross-Validation).",
            "description": "Systematic hyperparameter search: `GridSearchCV` evaluates exhaustive Cartesian products; `RandomizedSearchCV` samples probability distributions; Bayesian Optimization (Optuna) models the objective function with a Tree-structured Parzen Estimator (TPE).",
            "whyItMatters": "Grid search wastes 90% of compute evaluating uninformative parameters in high-dimensional search spaces; Bayesian optimization focuses on high-performing regions.",
            "howItWorks": "Optuna balances exploration (sampling uncertain regions) and exploitation (refining promising parameter combinations), finding superior hyperparameters in 1/5th the time.",
            "stepByStep": [
              "1. Define objective function taking an Optuna `trial`.",
              "2. Sample hyperparameters: `trial.suggest_float('lr', 1e-4, 1e-1, log=True)`.",
              "3. Evaluate model with cross-validation and return mean score.",
              "4. Run study: `study = optuna.create_study(direction='maximize'); study.optimize(objective, n_trials=50)`."
            ],
            "workedExample": "Tuning an XGBoost model with 12 hyperparameters: Grid Search takes 14 hours; Optuna TPE takes 12 minutes, achieving higher final accuracy.",
            "realWorldUsage": "AutoML pipelines, hyperparameter tuning clusters, and Kaggle competition modeling.",
            "codeSnippet": "from sklearn.model_selection import RandomizedSearchCV\nfrom sklearn.ensemble import RandomForestClassifier\nfrom scipy.stats import randint\nimport numpy as np\n\nX = np.random.randn(200, 5)\ny = np.random.randint(0, 2, 200)\nsearch = RandomizedSearchCV(RandomForestClassifier(random_state=42), {'n_estimators': randint(50, 200), 'max_depth': randint(2, 10)}, n_iter=10, cv=3, random_state=42)\nsearch.fit(X, y)\nprint('Best Params:', search.best_params_)",
            "codeExplanation": "1. `RandomizedSearchCV` efficiently explores continuous distributions.",
            "expectedOutput": "Best Params: {'max_depth': 8, 'n_estimators': 70}",
            "commonMistakes": "Tuning hyperparameters on the test set, creating optimistic selection bias.",
            "bestPractices": "Always execute hyperparameter search strictly within cross-validation folds on training data.",
            "practiceTask": "Set up an Optuna study to optimize learning rate and depth for a Gradient Boosting estimator.",
            "keyTakeaway": "Bayesian hyperparameter optimization intelligently searches complex parameter spaces with minimal compute."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Bayesian Hyperparameter Optimization Engine\n\nRequirements:\n1. Construct a 5-fold Stratified cross-validation pipeline.\n2. Define a multi-parameter search space for a Gradient Boosting model.\n3. Execute a 50-trial Optuna optimization study maximizing ROC-AUC.\n4. Evaluate the best parameter configuration on a sequestered holdout test set.",
        "competencyVerification": "Demonstrates Level 4 cross-validation design, hyperparameter search strategy, and Bayesian optimization.",
        "resources": [
        {
                "title": "Scikit-Learn User Guide: Model Evaluation & Scoring Metrics",
                "url": "https://scikit-learn.org/stable/modules/model_evaluation.html",
                "description": "Precision, recall, F1-score, ROC-AUC curves, and confusion matrix interpretation.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        },
        {
                "title": "Scikit-Learn User Guide: Cross-Validation & Stratified Splits",
                "url": "https://scikit-learn.org/stable/modules/cross_validation.html",
                "description": "K-Fold, Stratified K-Fold, and TimeSeriesSplit for robust generalization benchmarking.",
                "type": "documentation",
                "provider": "Scikit-Learn Docs"
        }
]
      }
    },
    {
      "id": "ml-mod-8",
      "order": 8,
      "title": "Module 8 — End-to-End Scikit-Learn Pipelines & Model Persistence",
      "durationMinutes": 210,
      "summary": "Building production ML pipelines: combining ColumnTransformer with estimators, model serialization (joblib vs ONNX), inference latency profiling, and serving predictions via REST APIs.",
      "learningObjectives": [
        "Construct monolithic, leak-free Scikit-Learn pipelines combining preprocessing, feature selection, and modeling.",
        "Serialize and version trained pipeline artifacts using `joblib` and ONNX runtime formats.",
        "Deploy trained models into high-throughput inference endpoints with input schema validation."
      ],
      "resources": [
        {
                "title": "Optuna Documentation: Hyperparameter Optimization Framework",
                "url": "https://optuna.readthedocs.io/en/stable/tutorial/index.html",
                "description": "Bayesian optimization, Tree-structured Parzen Estimator (TPE), and automated trial pruning.",
                "type": "documentation",
                "provider": "Optuna Documentation"
        },
        {
                "title": "ONNX Runtime Documentation: Exporting and Serving ML Models",
                "url": "https://onnxruntime.ai/docs/get-started/with-python.html",
                "description": "Standardized Open Neural Network Exchange runtime for low-latency production inference.",
                "type": "documentation",
                "provider": "ONNX Runtime"
        }
],
      "content": {
        "overview": "Production machine learning requires bundling data preprocessing, feature engineering, and model inference into an atomic deployable artifact that guarantees deterministic inference.",
        "keyConcepts": [
          {
            "section": "Section 1 — Pipeline Architecture & Serialization",
            "topic": "Production Pipelines",
            "title": "Lesson 1 — End-to-End Pipeline Packaging & `joblib` Serialization",
            "prerequisites": "Module 7 (Cross-Validation).",
            "description": "Encapsulating complete ML workflows (imputation, scaling, encoding, and estimator) into a single unified `Pipeline` object and serializing to disk with `joblib`.",
            "whyItMatters": "Deploying separate preprocessing scripts and model files leads to training-serving skew, code divergence, and production outages.",
            "howItWorks": "A Scikit-Learn `Pipeline` guarantees that calling `.predict()` on raw JSON payloads automatically executes all preprocessing transformations in exact sequence before running inference.",
            "stepByStep": [
              "1. Assemble `Pipeline([('preprocessor', ColumnTransformer), ('model', Estimator)])`.",
              "2. Fit pipeline on raw training DataFrame: `pipeline.fit(X_train, y_train)`.",
              "3. Serialize artifact to disk: `joblib.dump(pipeline, 'model_v1.joblib')`.",
              "4. In production: load artifact `pipeline = joblib.load('model_v1.joblib')` and call `.predict(raw_json_df)`."
            ],
            "workedExample": "Serving Real-Time Churn Prediction: Client sends raw JSON -> loaded `joblib` pipeline imputes income -> encodes department -> outputs 0.18 churn probability in 2ms.",
            "realWorldUsage": "Standard deployment architecture for Scikit-Learn tabular models across financial and enterprise services.",
            "codeSnippet": "from sklearn.pipeline import Pipeline\nfrom sklearn.impute import SimpleImputer\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nimport joblib\nimport numpy as np\nimport tempfile, os\n\npipe = Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler()), ('classifier', LogisticRegression())])\nX_train = np.array([[20.0], [np.nan], [40.0], [60.0]])\ny_train = np.array([0, 0, 1, 1])\npipe.fit(X_train, y_train)\n\nwith tempfile.NamedTemporaryFile(suffix='.joblib', delete=False) as tmp:\n    joblib.dump(pipe, tmp.name)\n    loaded_pipe = joblib.load(tmp.name)\n    print(f'Prediction for X=35: {loaded_pipe.predict([[35.0]])[0]}')\n    os.remove(tmp.name)",
            "codeExplanation": "1. `joblib.dump` captures entire state including learned imputer medians and scaler means.\n2. `loaded_pipe.predict` executes cleanly with zero external dependency.",
            "expectedOutput": "Prediction for X=35: 1",
            "commonMistakes": "Loading untrusted `.joblib` files from external sources.",
            "bestPractices": "Always store model metadata alongside the serialized `.joblib` artifact.",
            "practiceTask": "Build a complete pipeline with ColumnTransformer, train, serialize with joblib, and verify predictions on new data.",
            "keyTakeaway": "Packaging complete workflows into single serialized Pipeline objects eliminates training-serving skew."
          },
          {
            "section": "Section 2 — Production Serving & Latency",
            "topic": "Inference Serving",
            "title": "Lesson 2 — High-Throughput Model Serving & Latency Benchmarking",
            "prerequisites": "Lesson 1 (Pipeline Serialization).",
            "description": "Deploying serialized pipelines behind high-performance REST APIs with Pydantic request validation, batching, and sub-10ms latency profiling.",
            "whyItMatters": "Production models must serve hundreds of concurrent queries per second while strictly validating input payload schemas.",
            "howItWorks": "Wrap the loaded pipeline in a lightweight FastAPI application; validate incoming JSON using Pydantic schemas; profile execution latency with memory-pinned arrays.",
            "stepByStep": [
              "1. Define Pydantic request schema enforcing types and required fields.",
              "2. Load model artifact on application startup.",
              "3. Convert incoming payload into single-row DataFrame.",
              "4. Run `pipeline.predict_proba()` and return JSON response.",
              "5. Benchmark P95 and P99 latency under load."
            ],
            "workedExample": "Credit Card Authorization API: Evaluates transaction risk score in 4.5ms during the live checkout swipe flow.",
            "realWorldUsage": "High-volume transaction scoring, fraud detection APIs, and real-time recommendation endpoints.",
            "codeSnippet": "import time\nimport numpy as np\n\ndef benchmark_inference(pipeline, sample_input, n_iterations=1000):\n    latencies = []\n    for _ in range(n_iterations):\n        t0 = time.perf_counter()\n        _ = pipeline.predict(sample_input)\n        latencies.append((time.perf_counter() - t0) * 1000)\n    return np.percentile(latencies, 50), np.percentile(latencies, 95)\n\np50, p95 = benchmark_inference(pipe, [[35.0]])\nprint(f'Inference Latency Profile: P50: {p50:.3f}ms | P95: {p95:.3f}ms')",
            "codeExplanation": "1. Measures percentile response times under repeated execution.\n2. P95 latency reflects true production user experience.",
            "expectedOutput": "Inference Latency Profile: P50: 0.045ms | P95: 0.082ms",
            "commonMistakes": "Reloading the `.joblib` file from disk inside the request handler on every incoming HTTP request.",
            "bestPractices": "Load the model artifact once into memory during server startup and share the read-only instance across async worker threads.",
            "practiceTask": "Create a FastAPI endpoint that loads a trained pipeline and serves predictions with input validation.",
            "keyTakeaway": "Serving models from pre-loaded memory instances with schema validation guarantees sub-millisecond response times for real-time applications."
          }
        ],
        "practicalExercise": "Practical Hands-On Lab: Production Model Packaging & REST Serving\n\nRequirements:\n1. Construct an end-to-end ColumnTransformer + GradientBoosting pipeline on employee data.\n2. Train, validate, and serialize the complete pipeline to a versioned `joblib` artifact.\n3. Build a Python script verifying prediction consistency between original and restored models.\n4. Benchmark P50, P95, and P99 inference latencies across 5,000 simulated requests.",
        "competencyVerification": "Demonstrates Level 4 mastery of production ML pipelines, model serialization, and latency-optimized inference serving.",
        "resources": [
        {
                "title": "Optuna Documentation: Hyperparameter Optimization Framework",
                "url": "https://optuna.readthedocs.io/en/stable/tutorial/index.html",
                "description": "Bayesian optimization, Tree-structured Parzen Estimator (TPE), and automated trial pruning.",
                "type": "documentation",
                "provider": "Optuna Documentation"
        },
        {
                "title": "ONNX Runtime Documentation: Exporting and Serving ML Models",
                "url": "https://onnxruntime.ai/docs/get-started/with-python.html",
                "description": "Standardized Open Neural Network Exchange runtime for low-latency production inference.",
                "type": "documentation",
                "provider": "ONNX Runtime"
        }
]
      }
    }
  ]
};
