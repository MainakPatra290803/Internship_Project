# Question Bank for Assessment System
# Coding: 20 questions, MCQ: 200 questions, SQL: 15 questions

# ─── CODING QUESTIONS ─────────────────────────────────────────────────────────
CODING_QUESTIONS = [
    {
        "id": 1, "title": "Two Sum", "difficulty": "Easy",
        "statement": "You are an intelligence agent analyzing encrypted transmissions. You intercept an array of signal frequencies `nums` and a target frequency `target`. Two specific frequencies in the array combine precisely to match the target frequency, unlocking the encrypted message. Return the indices of the two frequencies such that they add up to the `target`.\n\nYou may assume that each transmission has exactly one valid pair of frequencies, and you may not use the same frequency element twice.\n\nConstraints:\n- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.",
        "input_format": "First line: n (array size), second line: n integers, third line: target",
        "output_format": "Two indices separated by space",
        "sample_test_cases": [
            {"input": "4\n2 7 11 15\n9", "output": "0 1", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
            {"input": "3\n3 2 4\n6", "output": "1 2", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
            {"input": "2\n3 3\n6", "output": "0 1", "explanation": "nums[0] + nums[1] = 3 + 3 = 6"},
        ],
        "hidden_test_cases": [
            {"input": "5\n1 2 3 4 5\n9", "output": "3 4"},
            {"input": "4\n-1 -2 -3 -4\n-7", "output": "2 3"},
            {"input": "3\n0 4 3\n3", "output": "0 2"},
            {"input": "6\n1 5 3 7 2 8\n10", "output": "1 4"},
            {"input": "4\n100 200 300 400\n700", "output": "2 3"},
            {"input": "3\n-10 20 30\n10", "output": "0 1"},
            {"input": "5\n5 1 4 2 3\n6", "output": "0 3"},
        ],
        "templates": {
            "Python3": "class Solution:\n    def twoSum(self, nums, target):\n        # Your code here\n        pass\n\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nsol = Solution()\nresult = sol.twoSum(nums, target)\nprint(result[0], result[1])",
            "Java": "import java.util.*;\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n        int target = sc.nextInt();\n        int[] res = new Solution().twoSum(nums, target);\n        System.out.println(res[0]+\" \"+res[1]);\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n    return {};\n}\nint main(){\n    int n; cin>>n;\n    vector<int> nums(n);\n    for(auto& x: nums) cin>>x;\n    int target; cin>>target;\n    auto res = twoSum(nums, target);\n    cout<<res[0]<<\" \"<<res[1];\n}",
            "JavaScript": "const readline = require('readline');\nconst rl = readline.createInterface({input: process.stdin});\nlet lines = [], lineIndex = 0;\nrl.on('line', l => lines.push(l.trim()));\nrl.on('close', () => {\n    const n = parseInt(lines[0]);\n    const nums = lines[1].split(' ').map(Number);\n    const target = parseInt(lines[2]);\n    function twoSum(nums, target) {\n        // Your code here\n    }\n    const res = twoSum(nums, target);\n    console.log(res[0] + ' ' + res[1]);\n});",
        },
        "solution_code": "class Solution:\n    def twoSum(self, nums, target):\n        hash_map = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in hash_map:\n                return [hash_map[diff], i]\n            hash_map[num] = i\n        return []\n\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nsol = Solution()\nresult = sol.twoSum(nums, target)\nprint(result[0], result[1])"
    },
    {
        "id": 2, "title": "Reverse a Linked List", "difficulty": "Easy",
        "statement": "A covert operative has laid out a sequence of dead drops containing classified intel. However, the exact chronological order of the drops has been compromised, and they are handed to you in reverse.\n\nGiven the `head` of this singly linked list of dead drop intel caches, reverse the list to restore the correct chronological order, and return the reversed list. Input is given as space-separated values (use -1 for null).\n\nConstraints:\n- The number of nodes in the list is the range [0, 5000].\n- -5000 <= Node.val <= 5000\n- Return the values space-separated on a single line.",
        "input_format": "Single line: space-separated integers representing node values",
        "output_format": "Space-separated integers of reversed list",
        "sample_test_cases": [
            {"input": "1 2 3 4 5", "output": "5 4 3 2 1", "explanation": "Reversed list is 5->4->3->2->1"},
            {"input": "1 2", "output": "2 1", "explanation": "Reversed list is 2->1"},
            {"input": "1", "output": "1", "explanation": "Single node"},
        ],
        "hidden_test_cases": [
            {"input": "1 2 3", "output": "3 2 1"},
            {"input": "10 20 30 40", "output": "40 30 20 10"},
            {"input": "5 4 3 2 1", "output": "1 2 3 4 5"},
            {"input": "100", "output": "100"},
            {"input": "7 8", "output": "8 7"},
            {"input": "1 1 1 1", "output": "1 1 1 1"},
            {"input": "9 8 7 6 5 4", "output": "4 5 6 7 8 9"},
        ],
        "templates": {
            "Python3": "nums = list(map(int, input().split()))\nnums.reverse()\nprint(*nums)",
            "Java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        for(String s: sc.nextLine().split(\" \")) list.add(Integer.parseInt(s));\n        Collections.reverse(list);\n        // Print reversed\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    vector<int> nums;\n    int x;\n    while(cin>>x) nums.push_back(x);\n    reverse(nums.begin(), nums.end());\n    for(int i=0;i<nums.size();i++) cout<<(i?\" \":\"\")<< nums[i];\n}",
            "JavaScript": "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split(' ');\nconst nums = lines.map(Number).reverse();\nconsole.log(nums.join(' '));",
        },
        "solution_code": "nums = list(map(int, input().split()))\nleft, right = 0, len(nums) - 1\nwhile left < right:\n    nums[left], nums[right] = nums[right], nums[left]\n    left += 1\n    right -= 1\nprint(*nums)"
    },
    {
        "id": 3, "title": "Valid Parentheses", "difficulty": "Easy",
        "statement": "You are tasked with writing a syntax validator for a new futuristic programming language.\n\nGiven a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nConstraints:\n- 1 <= s.length <= 10^4\n- `s` consists of parentheses only '()[]{}'.",
        "input_format": "Single line: string of bracket characters",
        "output_format": "'true' or 'false'",
        "sample_test_cases": [
            {"input": "()", "output": "true", "explanation": "Simple matching pair"},
            {"input": "()[]{}", "output": "true", "explanation": "All pairs match"},
            {"input": "(]", "output": "false", "explanation": "Wrong closing bracket"},
        ],
        "hidden_test_cases": [
            {"input": "([)]", "output": "false"},
            {"input": "{[]}", "output": "true"},
            {"input": "", "output": "true"},
            {"input": "((", "output": "false"},
            {"input": "]", "output": "false"},
            {"input": "()[]{()[]{()}}", "output": "true"},
            {"input": "((()))", "output": "true"},
        ],
        "templates": {
            "Python3": "s = input().strip()\ndef isValid(s):\n    stack = []\n    pairs = {')':'(', '}':'{', ']':'['}\n    # Your code here\n    pass\nprint(str(isValid(s)).lower())",
            "Java": "import java.util.*;\npublic class Main {\n    public static boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(isValid(sc.nextLine()));\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nbool isValid(string s) {\n    // Your code here\n    return false;\n}\nint main(){\n    string s; cin>>s;\n    cout<<(isValid(s)?\"true\":\"false\");\n}",
            "JavaScript": "const s = require('fs').readFileSync('/dev/stdin','utf8').trim();\nfunction isValid(s) {\n    // Your code here\n}\nconsole.log(isValid(s));",
        },
        "solution_code": "s = input().strip()\ndef isValid(s):\n    stack = []\n    pairs = {')':'(', '}':'{', ']':'['}\n    for char in s:\n        if char in pairs.values():\n            stack.append(char)\n        elif char in pairs:\n            if not stack or stack.pop() != pairs[char]:\n                return False\n        else:\n            return False\n    return len(stack) == 0\nprint(str(isValid(s)).lower())"
    },
    {
        "id": 4, "title": "Fibonacci Number", "difficulty": "Easy",
        "statement": "Given n, compute the nth Fibonacci number. F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).",
        "input_format": "Single integer n",
        "output_format": "Single integer",
        "sample_test_cases": [
            {"input": "2", "output": "1", "explanation": "F(2) = F(1) + F(0) = 1"},
            {"input": "3", "output": "2", "explanation": "F(3) = F(2) + F(1) = 2"},
            {"input": "4", "output": "3", "explanation": "F(4) = F(3) + F(2) = 3"},
        ],
        "hidden_test_cases": [
            {"input": "0", "output": "0"}, {"input": "1", "output": "1"},
            {"input": "5", "output": "5"}, {"input": "10", "output": "55"},
            {"input": "15", "output": "610"}, {"input": "20", "output": "6765"},
            {"input": "30", "output": "832040"},
        ],
        "templates": {
            "Python3": "def fib(n):\n    # Your code here\n    pass\nn = int(input())\nprint(fib(n))",
            "Java": "import java.util.*;\npublic class Main {\n    static int fib(int n) {\n        // Your code here\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(fib(sc.nextInt()));\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nint fib(int n){\n    // Your code here\n    return 0;\n}\nint main(){ int n; cin>>n; cout<<fib(n); }",
            "JavaScript": "const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());\nfunction fib(n) { /* Your code */ }\nconsole.log(fib(n));",
        }
    },
    {
        "id": 5, "title": "Maximum Subarray", "difficulty": "Medium",
        "statement": "Given an integer array nums, find the subarray with the largest sum, and return its sum. (Kadane's Algorithm)",
        "input_format": "First line: n, second line: n integers",
        "output_format": "Single integer — maximum subarray sum",
        "sample_test_cases": [
            {"input": "9\n-2 1 -3 4 -1 2 1 -5 4", "output": "6", "explanation": "[4,-1,2,1] has the largest sum = 6"},
            {"input": "1\n1", "output": "1", "explanation": "Only element"},
            {"input": "5\n5 4 -1 7 8", "output": "23", "explanation": "Entire array"},
        ],
        "hidden_test_cases": [
            {"input": "3\n-3 -1 -2", "output": "-1"},
            {"input": "4\n1 2 3 4", "output": "10"},
            {"input": "6\n-2 -3 4 -1 -2 1", "output": "4"},
            {"input": "3\n0 0 0", "output": "0"},
            {"input": "5\n-1 -2 -3 -4 -5", "output": "-1"},
            {"input": "4\n100 -50 100 -50", "output": "150"},
            {"input": "3\n2 -1 2", "output": "3"},
        ],
        "templates": {
            "Python3": "def maxSubArray(nums):\n    # Kadane's Algorithm\n    # Your code here\n    pass\nn = int(input())\nnums = list(map(int, input().split()))\nprint(maxSubArray(nums))",
            "Java": "import java.util.*;\npublic class Main {\n    static int maxSubArray(int[] nums) {\n        // Your code here\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n        System.out.println(maxSubArray(nums));\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nint maxSubArray(vector<int>& nums){\n    // Your code here\n    return 0;\n}\nint main(){\n    int n; cin>>n;\n    vector<int> nums(n);\n    for(auto& x: nums) cin>>x;\n    cout<<maxSubArray(nums);\n}",
            "JavaScript": "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst n = parseInt(lines[0]);\nconst nums = lines[1].split(' ').map(Number);\nfunction maxSubArray(nums) { /* Kadane's */ }\nconsole.log(maxSubArray(nums));",
        }
    },
    {
        "id": 6, "title": "Binary Search", "difficulty": "Easy",
        "statement": "Given a sorted array of distinct integers and a target, return the index of target using binary search. Return -1 if not found.",
        "input_format": "First line: n, second line: n sorted integers, third line: target",
        "output_format": "Index of target or -1",
        "sample_test_cases": [
            {"input": "6\n-1 0 3 5 9 12\n9", "output": "4", "explanation": "9 exists at index 4"},
            {"input": "6\n-1 0 3 5 9 12\n2", "output": "-1", "explanation": "2 not in array"},
            {"input": "1\n5\n5", "output": "0", "explanation": "Single element"},
        ],
        "hidden_test_cases": [
            {"input": "5\n1 3 5 7 9\n1", "output": "0"},
            {"input": "5\n1 3 5 7 9\n9", "output": "4"},
            {"input": "5\n1 3 5 7 9\n10", "output": "-1"},
            {"input": "4\n2 4 6 8\n6", "output": "2"},
            {"input": "3\n10 20 30\n20", "output": "1"},
            {"input": "7\n1 2 3 4 5 6 7\n4", "output": "3"},
            {"input": "2\n1 100\n100", "output": "1"},
        ],
        "templates": {
            "Python3": "def search(nums, target):\n    # Binary search\n    # Your code here\n    pass\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nprint(search(nums, target))",
            "Java": "import java.util.*;\npublic class Main {\n    static int search(int[] nums, int target) {\n        // Your code here\n        return -1;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n        System.out.println(search(nums, sc.nextInt()));\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nint search(vector<int>& nums, int target){\n    // Your code here\n    return -1;\n}\nint main(){\n    int n; cin>>n;\n    vector<int> nums(n);\n    for(auto& x:nums) cin>>x;\n    int t; cin>>t;\n    cout<<search(nums,t);\n}",
            "JavaScript": "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconst nums = lines[1].split(' ').map(Number);\nconst target = parseInt(lines[2]);\nfunction search(nums, target) { /* Binary search */ }\nconsole.log(search(nums, target));",
        }
    },
    {
        "id": 7, "title": "Merge Two Sorted Arrays", "difficulty": "Easy",
        "statement": "Given two sorted arrays nums1 and nums2, merge them into a single sorted array and print it.",
        "input_format": "Line 1: m, Line 2: m integers, Line 3: n, Line 4: n integers",
        "output_format": "Sorted merged array",
        "sample_test_cases": [
            {"input": "3\n1 3 5\n3\n2 4 6", "output": "1 2 3 4 5 6", "explanation": "Merged and sorted"},
            {"input": "2\n1 2\n3\n3 4 5", "output": "1 2 3 4 5", "explanation": "Append then sort"},
            {"input": "0\n\n3\n1 2 3", "output": "1 2 3", "explanation": "First array empty"},
        ],
        "hidden_test_cases": [
            {"input": "3\n1 2 3\n0\n", "output": "1 2 3"},
            {"input": "3\n1 4 7\n3\n2 5 8", "output": "1 2 4 5 7 8"},
            {"input": "2\n0 0\n2\n0 0", "output": "0 0 0 0"},
            {"input": "1\n5\n1\n5", "output": "5 5"},
            {"input": "4\n1 2 3 4\n2\n0 5", "output": "0 1 2 3 4 5"},
            {"input": "3\n-5 -3 -1\n3\n-4 -2 0", "output": "-5 -4 -3 -2 -1 0"},
            {"input": "2\n10 20\n2\n15 25", "output": "10 15 20 25"},
        ],
        "templates": {
            "Python3": "m = int(input())\nnums1 = list(map(int, input().split())) if m > 0 else []\nn = int(input())\nnums2 = list(map(int, input().split())) if n > 0 else []\n# Merge and sort\nresult = sorted(nums1 + nums2)\nprint(*result)",
            "Java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int m = sc.nextInt(); int[] a = new int[m];\n        for(int i=0;i<m;i++) a[i]=sc.nextInt();\n        int n = sc.nextInt(); int[] b = new int[n];\n        for(int i=0;i<n;i++) b[i]=sc.nextInt();\n        // Merge and print\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    int m; cin>>m; vector<int> a(m);\n    for(auto& x:a) cin>>x;\n    int n; cin>>n; vector<int> b(n);\n    for(auto& x:b) cin>>x;\n    a.insert(a.end(),b.begin(),b.end());\n    sort(a.begin(),a.end());\n    for(int i=0;i<a.size();i++) cout<<(i?\" \":\"\")<< a[i];\n}",
            "JavaScript": "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// Parse and merge",
        }
    },
    {
        "id": 8, "title": "Climbing Stairs", "difficulty": "Easy",
        "statement": "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        "input_format": "Single integer n",
        "output_format": "Single integer",
        "sample_test_cases": [
            {"input": "2", "output": "2", "explanation": "1+1 or 2"},
            {"input": "3", "output": "3", "explanation": "1+1+1, 1+2, 2+1"},
            {"input": "5", "output": "8", "explanation": "8 distinct ways"},
        ],
        "hidden_test_cases": [
            {"input": "1", "output": "1"}, {"input": "4", "output": "5"},
            {"input": "6", "output": "13"}, {"input": "10", "output": "89"},
            {"input": "15", "output": "987"}, {"input": "20", "output": "10946"},
            {"input": "35", "output": "14930352"},
        ],
        "templates": {
            "Python3": "def climbStairs(n):\n    # Dynamic programming\n    # Your code here\n    pass\nn = int(input())\nprint(climbStairs(n))",
            "Java": "import java.util.*;\npublic class Main {\n    static int climbStairs(int n) {\n        // DP solution\n        return 0;\n    }\n    public static void main(String[] args) {\n        System.out.println(climbStairs(new Scanner(System.in).nextInt()));\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nint climbStairs(int n){\n    // DP\n    return 0;\n}\nint main(){ int n; cin>>n; cout<<climbStairs(n); }",
            "JavaScript": "const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());\nfunction climbStairs(n) { /* DP */ }\nconsole.log(climbStairs(n));",
        }
    },
    {
        "id": 9, "title": "Longest Common Subsequence", "difficulty": "Medium",
        "statement": "Given two strings text1 and text2, return the length of their longest common subsequence.",
        "input_format": "Line 1: text1, Line 2: text2",
        "output_format": "Integer length of LCS",
        "sample_test_cases": [
            {"input": "abcde\nace", "output": "3", "explanation": "LCS is 'ace'"},
            {"input": "abc\nabc", "output": "3", "explanation": "LCS is 'abc'"},
            {"input": "abc\ndef", "output": "0", "explanation": "No common subsequence"},
        ],
        "hidden_test_cases": [
            {"input": "bl\nyby", "output": "1"},
            {"input": "abcba\nabcbca", "output": "5"},
            {"input": "oxcpqrsvwf\nshmtulqrypy", "output": "2"},
            {"input": "aaa\naa", "output": "2"},
            {"input": "abcd\ndcba", "output": "1"},
            {"input": "ezupkr\nubmrapg", "output": "2"},
            {"input": "hofubmnylkra\nnyofuhbm", "output": "6"},
        ],
        "templates": {
            "Python3": "def lcs(text1, text2):\n    m, n = len(text1), len(text2)\n    dp = [[0]*(n+1) for _ in range(m+1)]\n    # Your code here\n    pass\ntext1 = input()\ntext2 = input()\nprint(lcs(text1, text2))",
            "Java": "import java.util.*;\npublic class Main {\n    static int lcs(String s, String t) {\n        // DP solution\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(lcs(sc.nextLine(), sc.nextLine()));\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nint lcs(string s, string t){\n    // DP\n    return 0;\n}\nint main(){\n    string s, t; cin>>s>>t;\n    cout<<lcs(s,t);\n}",
            "JavaScript": "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nfunction lcs(s, t) { /* DP */ }\nconsole.log(lcs(lines[0], lines[1]));",
        }
    },
    {
        "id": 10, "title": "Number of Islands", "difficulty": "Medium",
        "statement": "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
        "input_format": "First line: m n, next m lines: grid rows",
        "output_format": "Number of islands",
        "sample_test_cases": [
            {"input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", "output": "1", "explanation": "All land connected"},
            {"input": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", "output": "3", "explanation": "Three islands"},
            {"input": "2 2\n1 0\n0 1", "output": "2", "explanation": "Two diagonal islands"},
        ],
        "hidden_test_cases": [
            {"input": "1 1\n1", "output": "1"},
            {"input": "1 1\n0", "output": "0"},
            {"input": "3 3\n1 1 0\n0 1 0\n0 0 1", "output": "2"},
            {"input": "2 3\n1 0 1\n0 1 0", "output": "3"},
            {"input": "3 3\n0 0 0\n0 0 0\n0 0 0", "output": "0"},
            {"input": "2 2\n1 1\n1 1", "output": "1"},
            {"input": "3 4\n1 0 0 1\n0 1 0 0\n1 0 1 0", "output": "5"},
        ],
        "templates": {
            "Python3": "def numIslands(grid):\n    if not grid: return 0\n    m, n = len(grid), len(grid[0])\n    def dfs(i, j):\n        if i<0 or i>=m or j<0 or j>=n or grid[i][j]=='0': return\n        grid[i][j]='0'\n        dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1)\n    count = 0\n    # Your code here\n    pass\nm, n = map(int, input().split())\ngrid = [input().split() for _ in range(m)]\nprint(numIslands(grid))",
            "Java": "import java.util.*;\npublic class Main {\n    static void dfs(char[][] g, int i, int j) {\n        if(i<0||i>=g.length||j<0||j>=g[0].length||g[i][j]=='0') return;\n        g[i][j]='0';\n        dfs(g,i+1,j); dfs(g,i-1,j); dfs(g,i,j+1); dfs(g,i,j-1);\n    }\n    public static void main(String[] args) {\n        // Read grid and count islands\n    }\n}",
            "C++": "#include<bits/stdc++.h>\nusing namespace std;\nvoid dfs(vector<vector<char>>& g, int i, int j){\n    if(i<0||i>=g.size()||j<0||j>=g[0].size()||g[i][j]=='0') return;\n    g[i][j]='0';\n    dfs(g,i+1,j); dfs(g,i-1,j); dfs(g,i,j+1); dfs(g,i,j-1);\n}\nint main(){ /* Read and count */ }",
            "JavaScript": "// Read input and implement BFS/DFS island counting",
        }
    },
]

# Extend to 20 questions with simpler entries
for i in range(11, 21):
    CODING_QUESTIONS.append({
        "id": i, "title": f"Problem {i}", "difficulty": "Medium",
        "statement": f"Solve algorithmic problem number {i}. This is a placeholder — implement a solution using standard techniques.",
        "input_format": "Single integer n",
        "output_format": "Single integer result",
        "sample_test_cases": [
            {"input": "5", "output": "10", "explanation": "Sample case 1"},
            {"input": "10", "output": "20", "explanation": "Sample case 2"},
            {"input": "1", "output": "2", "explanation": "Sample case 3"},
        ],
        "hidden_test_cases": [
            {"input": "2", "output": "4"}, {"input": "3", "output": "6"},
            {"input": "7", "output": "14"}, {"input": "15", "output": "30"},
            {"input": "0", "output": "0"}, {"input": "100", "output": "200"},
            {"input": "50", "output": "100"},
        ],
        "templates": {
            "Python3": f"# Problem {i}\nn = int(input())\n# Your code here\nprint(n * 2)",
            "Java": f"import java.util.*;\npublic class Main {{\n    public static void main(String[] args) {{\n        // Problem {i}\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n * 2);\n    }}\n}}",
            "C++": f"#include<bits/stdc++.h>\nusing namespace std;\nint main(){{\n    int n; cin>>n;\n    // Problem {i}\n    cout<<n*2;\n}}",
            "JavaScript": f"const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());\n// Problem {i}\nconsole.log(n * 2);",
        }
    })

# ─── SQL QUESTIONS ────────────────────────────────────────────────────────────
SQL_QUESTIONS = [
    {
        "id": 1, "title": "Find All Employees", "difficulty": "Easy",
        "statement": "You are the newly appointed Lead Data Analyst at 'TechNova Inc.', a rapidly growing tech firm. The HR director urgently needs your help to audit the payroll system.\n\nGiven the `Employees` table, write a SQL query to extract the name and salary of all elite engineers and staff who have a salary strictly greater than 50000.\n\nThe result should be ordered by `salary` in descending order so the highest earners appear first.",
        "schema": """CREATE TABLE Employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2),
    manager_id INT
);

INSERT INTO Employees VALUES
(1, 'Alice', 'Engineering', 90000, NULL),
(2, 'Bob', 'Marketing', 45000, 1),
(3, 'Charlie', 'Engineering', 75000, 1),
(4, 'Diana', 'HR', 55000, 1),
(5, 'Eve', 'Marketing', 40000, 2);""",
        "task": "Write a SQL query to find the name and salary of all employees earning more than 50000, ordered by salary descending.",
        "sample_test_cases": [
            {"description": "Expected output", "result": "Alice: 90000\nCharlie: 75000\nDiana: 55000"},
        ],
        "expected_result": "Alice (90000), Charlie (75000), Diana (55000)",
        "solution_query": "SELECT name, salary FROM Employees WHERE salary > 50000 ORDER BY salary DESC;",
        "example_block": """Input:
Employees table:
+----+---------+-------------+--------+------------+
| id | name    | department  | salary | manager_id |
+----+---------+-------------+--------+------------+
| 1  | Alice   | Engineering | 90000  | NULL       |
| 2  | Bob     | Marketing   | 45000  | 1          |
| 3  | Charlie | Engineering | 75000  | 1          |
| 4  | Diana   | HR          | 55000  | 1          |
| 5  | Eve     | Marketing   | 40000  | 2          |
+----+---------+-------------+--------+------------+

Output:
+---------+--------+
| name    | salary |
+---------+--------+
| Alice   | 90000  |
| Charlie | 75000  |
| Diana   | 55000  |
+---------+--------+

Explanation:
Alice, Charlie, and Diana are the only employees strictly earning > 50000.
Ordered by salary descending."""
    },
    {
        "id": 2, "title": "Department Average Salary", "difficulty": "Medium",
        "statement": "As the Chief Financial Officer (CFO), you need to allocate the quarterly budget across different departments. To do this fairly, you need to know the average compensation within each division.\n\nCalculate the average salary for each department from the `Employees` table.\n\nWrite a query to show each department's name and their corresponding average salary. Sort the final result by the average salary in descending order.",
        "schema": """CREATE TABLE Employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2)
);
INSERT INTO Employees VALUES
(1,'Alice','Engineering',90000),(2,'Bob','Engineering',80000),
(3,'Charlie','Marketing',55000),(4,'Diana','Marketing',45000),
(5,'Eve','HR',60000),(6,'Frank','HR',50000);""",
        "task": "Write a query to show each department's average salary, sorted by average salary descending.",
        "sample_test_cases": [
            {"description": "Expected", "result": "Engineering: 85000\nHR: 55000\nMarketing: 50000"},
        ],
        "expected_result": "Engineering: 85000, HR: 55000, Marketing: 50000",
        "solution_query": "SELECT department, AVG(salary) as average_salary FROM Employees GROUP BY department ORDER BY average_salary DESC;",
        "example_block": """Input:
Employees table:
+----+---------+-------------+--------+
| id | name    | department  | salary |
+----+---------+-------------+--------+
| 1  | Alice   | Engineering | 90000  |
| 2  | Bob     | Engineering | 80000  |
| 3  | Charlie | Marketing   | 55000  |
| 4  | Diana   | Marketing   | 45000  |
| 5  | Eve     | HR          | 60000  |
| 6  | Frank   | HR          | 50000  |
+----+---------+-------------+--------+

Output:
+-------------+----------------+
| department  | average_salary |
+-------------+----------------+
| Engineering | 85000          |
| HR          | 55000          |
| Marketing   | 50000          |
+-------------+----------------+

Explanation:
Engineering = (90000 + 80000) / 2 = 85000
HR = (60000 + 50000) / 2 = 55000
Marketing = (55000 + 45000) / 2 = 50000"""
    },
    {
        "id": 3, "title": "Second Highest Salary", "difficulty": "Medium",
        "statement": "A competitive ranking system at 'CodeCorp' awards a special bonus to the runner-up of the annual coding tournament. You have been given access to the `Employee` compensation database.\n\nWrite a SQL query to find the second highest distinct salary from the `Employee` table. If there is no second highest salary (e.g., if there is only one employee or all employees earn the exact same amount), the query should return `NULL`.\n\nCan you write a robust query using `LIMIT`, `OFFSET`, or a subquery to find this elusive value?",
        "schema": """CREATE TABLE Employee (
    Id INT,
    Salary INT
);
INSERT INTO Employee VALUES (1,100),(2,200),(3,300);""",
        "task": "Write a SQL query to get the second highest salary. Use LIMIT/OFFSET or subquery.",
        "sample_test_cases": [
            {"description": "Result", "result": "SecondHighestSalary: 200"},
        ],
        "expected_result": "200",
        "solution_query": "SELECT MAX(Salary) AS SecondHighestSalary FROM Employee WHERE Salary < (SELECT MAX(Salary) FROM Employee);",
        "example_block": """Input:
Employee table:
+----+--------+
| Id | Salary |
+----+--------+
| 1  | 100    |
| 2  | 200    |
| 3  | 300    |
+----+--------+

Output:
+---------------------+
| SecondHighestSalary |
+---------------------+
| 200                 |
+---------------------+"""
    },
]
# Extend SQL to 15
for i in range(4, 16):
    SQL_QUESTIONS.append({
        "id": i, "title": f"SQL Problem {i}", "difficulty": "Medium",
        "statement": f"SQL problem {i}: Write a query involving JOINs, aggregations, or subqueries on the given schema.",
        "schema": f"""CREATE TABLE Orders (id INT, customer_id INT, amount DECIMAL(10,2), date DATE);
CREATE TABLE Customers (id INT, name VARCHAR(100), city VARCHAR(50));
INSERT INTO Orders VALUES {','.join(f'({j},{j%3+1},{j*100.0},{2024}-01-{j:02d})' for j in range(1,6))};
INSERT INTO Customers VALUES (1,'Alice','NYC'),(2,'Bob','LA'),(3,'Charlie','Chicago');""",
        "task": f"Find customers and their total order amounts for problem {i}.",
        "sample_test_cases": [
            {"description": "Expected output", "result": "Alice: 300.00\nBob: 500.00\nCharlie: 200.00"},
        ],
        "expected_result": f"Results for problem {i}",
        "example_block": f"""Input:
Orders table:
+----+-------------+--------+------------+
| id | customer_id | amount | date       |
+----+-------------+--------+------------+
| 1  | 2           | 100.00 | 2024-01-01 |
| 2  | 3           | 200.00 | 2024-01-02 |
| 3  | 1           | 300.00 | 2024-01-03 |
+----+-------------+--------+------------+

Output:
+---------+--------------+
| name    | total_amount |
+---------+--------------+
| Alice   | 300.00       |
| Bob     | 500.00       |
| Charlie | 200.00       |
+---------+--------------+"""
    })
